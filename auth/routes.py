from flask import request, jsonify, url_for
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from database.models import User, db
from .utils import generate_tokens
from routes import *  # Import route constants

# Create a namespace without a prefix (the prefix will be added by the main API)
auth_ns = Namespace('auth', description='Authentication operations')

# Define endpoints for the auth namespace
auth_register = AUTH_REGISTER.replace('/auth/', '')
auth_login = AUTH_LOGIN.replace('/auth/', '')
auth_refresh = AUTH_REFRESH.replace('/auth/', '')
auth_profile = AUTH_PROFILE.replace('/auth/', '')
auth_demo_token = AUTH_DEMO_TOKEN.replace('/auth/', '')

# Models for request and response
user_model = auth_ns.model('User', {
    'username': fields.String(required=True, description='Username'),
    'email': fields.String(required=True, description='Email address'),
    'password': fields.String(required=True, description='Password')
})

login_model = auth_ns.model('Login', {
    'username': fields.String(required=True, description='Username or email'),
    'password': fields.String(required=True, description='Password')
})

token_model = auth_ns.model('Token', {
    'access_token': fields.String(description='JWT access token'),
    'refresh_token': fields.String(description='JWT refresh token'),
    'user': fields.Raw(description='User information')
})

@auth_ns.route('/register')
class Register(Resource):
    @auth_ns.expect(user_model)
    @auth_ns.doc(responses={201: 'User created', 400: 'Validation error'})
    def post(self):
        """Register a new user"""
        data = request.get_json()
        
        # Validate input
        if not data or not all(k in data for k in ('username', 'email', 'password')):
            return {'message': 'Missing required fields'}, 400
        
        # Check if user already exists
        if User.query.filter_by(username=data['username']).first():
            return {'message': 'Username already exists'}, 400
        
        if User.query.filter_by(email=data['email']).first():
            return {'message': 'Email already exists'}, 400
        
        # Create new user
        user = User(username=data['username'], email=data['email'])
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Generate tokens
        access_token, refresh_token = generate_tokens(user.id)
        
        return {
            'message': 'User created successfully',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }, 201

@auth_ns.route('/login')
class Login(Resource):
    @auth_ns.expect(login_model)
    @auth_ns.doc(
        responses={200: 'Login successful', 401: 'Invalid credentials'},
        description="For quick testing, use demo credentials: username='demo', password='password123'"
    )
    def post(self):
        """Login a user (Demo: username='demo', password='password123')"""
        data = request.get_json()
        
        if not data or not all(k in data for k in ('username', 'password')):
            return {'message': 'Missing required fields'}, 400
        
        # Check if username is actually an email
        if '@' in data['username']:
            user = User.query.filter_by(email=data['username']).first()
        else:
            user = User.query.filter_by(username=data['username']).first()
        
        if not user or not user.check_password(data['password']):
            return {'message': 'Invalid username or password'}, 401
        
        # Generate tokens
        access_token, refresh_token = generate_tokens(user.id)
        
        return {
            'message': 'Login successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }, 200

@auth_ns.route('/refresh')
class Refresh(Resource):
    @jwt_required(refresh=True)
    @auth_ns.doc(responses={200: 'Token refreshed', 401: 'Invalid token'})
    def post(self):
        """Refresh access token"""
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return {'message': 'User not found'}, 404
        
        # Generate new access token
        access_token = create_access_token(identity=current_user_id)
        
        return {
            'message': 'Token refreshed',
            'access_token': access_token,
            'user': user.to_dict()
        }, 200

@auth_ns.route('/profile')
class Profile(Resource):
    @jwt_required()
    @auth_ns.doc(
        responses={200: 'Profile retrieved', 401: 'Unauthorized'},
        description="Requires authentication. Add 'Bearer your-token' to the Authorization header."
    )
    def get(self):
        """Get user profile (requires authentication)"""
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return {'message': 'User not found'}, 404
        
        return {
            'message': 'Profile retrieved',
            'user': user.to_dict()
        }, 200

@auth_ns.route('/demo-token')
class DemoToken(Resource):
    @auth_ns.doc(
        responses={200: 'Demo token generated', 404: 'Demo user not found'},
        description="Get a token for the demo user without login"
    )
    def get(self):
        """Get a token for the demo user (for quick testing)"""
        demo_user = User.query.filter_by(username='demo').first()
        
        if not demo_user:
            return {'message': 'Demo user not found'}, 404
        
        # Generate tokens
        access_token, refresh_token = generate_tokens(demo_user.id)
        
        return {
            'message': 'Demo token generated',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': demo_user.to_dict(),
            'usage': 'Add this header to your requests: Authorization: Bearer ' + access_token
        }, 200 