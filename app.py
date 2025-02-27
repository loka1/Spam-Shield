import os
from flask import Flask, request, jsonify, render_template, url_for, redirect
from flask_cors import CORS
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from dotenv import load_dotenv
from config import Config
from models.spam_model import SpamDetector
from flask_restx import Api, Resource, fields
from database.models import db, User, RequestHistory
from database import init_app as init_db
from auth import init_app as init_auth
from auth.routes import auth_ns
from auth.utils import check_guest_limit
from functools import wraps
from routes import *  # Import route constants

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)
CORS(app)  # Enable CORS for all routes

# Initialize database
init_db(app)

# Initialize authentication
init_auth(app)

# Add a redirect from root to index
@app.route('/')
def root_redirect():
    """Redirect from root to index page"""
    return redirect(url_for('frontend_index'))

# Initialize Flask-RESTx
api = Api(
    app,
    version='1.0',
    title='Spam Detection API',
    description='''A simple API for detecting spam text for Flutter applications.
    
## Authentication
- **Guest access**: Limited to 10 requests per day
- **Authenticated access**: Unlimited requests with history tracking

### Demo User
For quick testing, you can:
1. Get a demo token at `/auth/demo-token`
2. Or login with: username=`demo`, password=`password123`

### Using Authentication
Add the header: `Authorization: Bearer your-token` to your requests
''',
    doc='/docs',
    authorizations={
        'apikey': {
            'type': 'apiKey',
            'in': 'header',
            'name': 'Authorization',
            'description': "Type in the *'Value'* input box below: **Bearer &lt;JWT&gt;**"
        }
    },
    security='apikey'
)

# Create namespaces
ns = api.namespace('api', description='Spam detection operations')
api.add_namespace(auth_ns, path='/auth')

# Frontend routes - Make sure these are registered AFTER Flask-RESTx
@app.route(ROUTE_INDEX, endpoint='frontend_index')
def index():
    return render_template('index.html')

@app.route(ROUTE_CHECK, endpoint='frontend_check')
def check_page():
    return render_template('check.html')

@app.route(ROUTE_LOGIN, endpoint='frontend_login')
def login_page():
    return render_template('login.html')

@app.route(ROUTE_REGISTER, endpoint='frontend_register')
def register_page():
    return render_template('register.html')

@app.route(ROUTE_HISTORY, endpoint='frontend_history')
def history_page():
    return render_template('history.html')

# Add a route to get all API URLs for JavaScript
@app.route('/api/urls', methods=['GET'])
def api_urls():
    """Return all API URLs for JavaScript to use"""
    base_url = request.url_root.rstrip('/')
    return jsonify({
        'auth': {
            'register': f"{base_url}/auth/register",
            'login': f"{base_url}/auth/login",
            'refresh': f"{base_url}/auth/refresh",
            'profile': f"{base_url}/auth/profile",
            'demo_token': f"{base_url}/auth/demo-token",
        },
        'api': {
            'check_spam': f"{base_url}/api/check-spam",
            'history': f"{base_url}/api/history",
            'example_spam': f"{base_url}/api/example/spam",
            'example_ham': f"{base_url}/api/example/ham",
        },
        'frontend': {
            'root': f"{base_url}/",
            'index': f"{base_url}/ui",
            'check': f"{base_url}/check",
            'login': f"{base_url}/login",
            'register': f"{base_url}/register",
            'history': f"{base_url}/history",
        }
    })

# Define models for request and response
spam_request = api.model('SpamRequest', {
    'text': fields.String(required=True, description='Text to check for spam')
})

spam_response = api.model('SpamResponse', {
    'status': fields.String(description='Status of the request'),
    'is_spam': fields.Boolean(description='Whether the text is spam or not'),
    'confidence': fields.Float(description='Confidence score (0-1)'),
    'text': fields.String(description='The text that was checked')
})

# Initialize spam detector
spam_detector = SpamDetector()

# Define a decorator for optional JWT authentication
def jwt_optional(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            return fn(*args, **kwargs)
        except Exception:
            # Continue without authentication
            return fn(*args, **kwargs)
    return wrapper

# API endpoints
@ns.route('/check-spam')
class SpamCheck(Resource):
    @api.doc(
        responses={
            200: 'Success',
            400: 'Validation Error',
            429: 'Rate limit exceeded'
        },
        security=[{'apikey': []}],
        description="Check if text is spam. Guest users are limited to 10 requests per day. For unlimited access, register an account."
    )
    @api.expect(spam_request)
    @api.marshal_with(spam_response, code=200)
    @jwt_optional
    def post(self):
        """Check if text is spam"""
        # Get request data
        data = request.get_json()
        
        if not data or 'text' not in data:
            return {
                "status": "error",
                "message": "Missing required field: text"
            }, 400
        
        text = data['text']
        
        # Check if user is authenticated
        user_id = None
        try:
            user_id = get_jwt_identity()
        except Exception:
            # User is not authenticated, check guest limit
            if not check_guest_limit():
                return {
                    "status": "error",
                    "message": "Rate limit exceeded. Please register for unlimited access."
                }, 429
        
        # Predict if text is spam
        is_spam, confidence = spam_detector.predict(text)
        
        # Save request to history if user is authenticated
        if user_id:
            history_entry = RequestHistory(
                user_id=user_id,
                text=text,
                is_spam=is_spam,
                confidence=confidence
            )
            db.session.add(history_entry)
            db.session.commit()
        
        return {
            "status": "success",
            "is_spam": bool(is_spam),
            "confidence": float(confidence),
            "text": text
        }

# User history endpoint
@ns.route('/history')
class UserHistory(Resource):
    @api.doc(
        responses={
            200: 'Success',
            401: 'Unauthorized',
            500: 'Internal Server Error'
        },
        security=[{'apikey': []}],
        description="Get the user's spam check history. Requires authentication. For testing, get a demo token at /auth/demo-token"
    )
    @jwt_required()
    def get(self):
        """Get user's spam check history (requires authentication)"""
        user_id = get_jwt_identity()
        
        # Get user history
        history = RequestHistory.query.filter_by(user_id=user_id).order_by(RequestHistory.timestamp.desc()).all()
        
        return {
            "status": "success",
            "history": [item.to_dict() for item in history]
        }

# Example endpoints
@ns.route('/example/spam')
class SpamExample(Resource):
    @api.doc(responses={200: 'Success'})
    @api.marshal_with(spam_response, code=200)
    def get(self):
        """Get an example of spam detection for a typical spam message"""
        spam_text = "Congratulations! You've won a free gift card. Click here to claim your prize now!"
        is_spam, confidence = spam_detector.predict(spam_text)
        
        return {
            "status": "success",
            "is_spam": bool(is_spam),
            "confidence": float(confidence),
            "text": spam_text
        }

@ns.route('/example/ham')
class HamExample(Resource):
    @api.doc(responses={200: 'Success'})
    @api.marshal_with(spam_response, code=200)
    def get(self):
        """Get an example of spam detection for a typical non-spam message"""
        ham_text = "Hey, can we meet tomorrow for coffee at 2pm? Let me know if that works for you."
        is_spam, confidence = spam_detector.predict(ham_text)
        
        return {
            "status": "success",
            "is_spam": bool(is_spam),
            "confidence": float(confidence),
            "text": ham_text
        }

# Error handlers
@app.errorhandler(404)
def not_found(e):
    return jsonify({
        "status": "error",
        "message": "Endpoint not found"
    }), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({
        "status": "error",
        "message": "Internal server error"
    }), 500

@app.route('/debug/endpoints')
def list_endpoints():
    """List all registered endpoints"""
    endpoints = []
    for rule in app.url_map.iter_rules():
        endpoints.append({
            'endpoint': rule.endpoint,
            'methods': list(rule.methods),
            'path': str(rule)
        })
    return jsonify(endpoints)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port) 