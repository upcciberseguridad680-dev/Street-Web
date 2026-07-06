from flask import Blueprint, request, redirect, url_for, session, flash, current_app
from flask_wtf.csrf import generate_csrf
from app.models import db, User
from app.frontend import render_frontend

auth_bp = Blueprint('auth', __name__)


def get_limiter():
    """Get the limiter instance from the current app."""
    limiter = current_app.extensions.get('limiter')
    if limiter is None:
        # Create a fallback limiter that doesn't actually limit (for safety)
        class FallbackLimiter:
            def limit(self, limit_string):
                def decorator(f):
                    return f
                return decorator
        return FallbackLimiter()
    return limiter


@auth_bp.route('/login', methods=['GET', 'POST'])
@get_limiter().limit("5 per minute")
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            session['user_id'] = user.id
            session['username'] = user.username
            flash('Inicio de sesión correcto.', 'success')
            return redirect(url_for('main.dashboard'))
        else:
            # Generic error message to prevent user enumeration
            flash('Usuario o contraseña inválidos.', 'error')
    return render_frontend('login', csrfToken=generate_csrf())


@auth_bp.route('/logout')
def logout():
    session.clear()
    flash('Sesión cerrada.', 'info')
    return redirect(url_for('auth.login'))


@auth_bp.route('/register', methods=['GET', 'POST'])
@get_limiter().limit("5 per minute")
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']

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