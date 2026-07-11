from flask import Blueprint, request, redirect, url_for, session, flash
from flask_wtf.csrf import generate_csrf
from app.models import db, User, LoginAttempt
from app.frontend import render_frontend
from app.extensions import limiter
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)


def get_login_key():
    """Generate a key for rate limiting based on username or IP"""
    username = request.form.get('username') if request.method == 'POST' else None
    if username:
        return f"login:{username}"
    else:
        return f"login_ip:{request.remote_addr}"


def get_register_key():
    """Generate a key for rate limiting based on email or IP"""
    email = request.form.get('email') if request.method == 'POST' else None
    if email:
        return f"register:{email}"
    else:
        return f"register_ip:{request.remote_addr}"


@auth_bp.route('/login', methods=['GET', 'POST'])
@limiter.limit("10 per minute", key_func=get_login_key)
@limiter.limit("5 per minute", key_func=lambda: request.remote_addr)
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        ip_address = request.remote_addr

        # Check for excessive failed login attempts (account lockout)
        failed_attempts = LoginAttempt.query.filter_by(
            username=username,
            success=False
        ).filter(
            LoginAttempt.timestamp >= datetime.utcnow() - timedelta(minutes=15)
        ).count()

        if failed_attempts >= 5:
            # Too many failed attempts - temporarily lock account
            flash('Demasiados intentos fallidos. Tu cuenta ha sido bloqueada temporalmente por 15 minutos.', 'error')
            # Log the attempt even though we're not checking credentials
            failed_attempt = LoginAttempt(
                username=username,
                ip_address=ip_address,
                success=False
            )
            db.session.add(failed_attempt)
            db.session.commit()
            return render_frontend('login', csrfToken=generate_csrf()), 429

        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            # Successful login
            successful_login = LoginAttempt(
                username=username,
                ip_address=ip_address,
                success=True
            )
            db.session.add(successful_login)
            db.session.commit()

            session['user_id'] = user.id
            session['username'] = user.username
            session['is_admin'] = user.is_admin
            flash('Inicio de sesión correcto.', 'success')
            return redirect(url_for('main.dashboard'))
        else:
            # Failed login
            failed_attempt = LoginAttempt(
                username=username,
                ip_address=ip_address,
                success=False
            )
            db.session.add(failed_attempt)
            db.session.commit()

            # Generic error message to prevent user enumeration
            flash('Usuario o contraseña inválidos.', 'error')
    return render_frontend('login', csrfToken=generate_csrf())


@auth_bp.route('/logout')
def logout():
    session.clear()
    flash('Sesión cerrada.', 'info')
    return redirect(url_for('auth.login'))


@auth_bp.route('/register', methods=['GET', 'POST'])
@limiter.limit("10 per minute", key_func=get_register_key)
@limiter.limit("5 per minute", key_func=lambda: request.remote_addr)
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        ip_address = request.remote_addr

        # Always show the same message to prevent user enumeration
        # Whether the user exists or not, we show the same success message
        # and redirect to login
        existing_user = User.query.filter_by(username=username).first()
        existing_email = User.query.filter_by(email=email).first()

        if not existing_user and not existing_email:
            user = User(username=username, email=email)
            user.set_password(password)
            db.session.add(user)
            db.session.commit()

        # Always show the same message to prevent username/email enumeration
        flash('Registro completado. Inicia sesión.', 'success')
        return redirect(url_for('auth.login'))
    return render_frontend('register', csrfToken=generate_csrf())