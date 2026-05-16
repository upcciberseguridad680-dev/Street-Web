from flask import Blueprint, request, redirect, url_for, session, flash
from flask_wtf.csrf import generate_csrf
from app.models import db, User
from app.frontend import render_frontend

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
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
            flash('Usuario o contraseña inválidos.', 'error')
    return render_frontend('login', csrfToken=generate_csrf())

@auth_bp.route('/logout')
def logout():
    session.clear()
    flash('Sesión cerrada.', 'info')
    return redirect(url_for('auth.login'))

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        if User.query.filter_by(username=username).first():
            flash('El usuario ya existe.', 'error')
            return redirect(url_for('auth.register'))
        if User.query.filter_by(email=email).first():
            flash('El email ya está registrado.', 'error')
            return redirect(url_for('auth.register'))
        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        flash('Registro completado. Inicia sesión.', 'success')
        return redirect(url_for('auth.login'))
    return render_frontend('register', csrfToken=generate_csrf())
