import os
from flask import Flask, request, jsonify
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

# Define models for request and response
spam_request = api.model('SpamRequest', {
    'text': fields.String(required=True, description='Text to check for spam')
})

spam_response = api.model('SpamResponse', {
    'status': fields.String(description='Response status'),
    'is_spam': fields.Boolean(description='Whether the text is spam or not'),
    'confidence': fields.Float(description='Confidence score of the prediction'),
    'text': fields.String(description='The original text that was checked')
})

history_response = api.model('HistoryResponse', {
    'id': fields.Integer(description='History ID'),
    'text': fields.String(description='Text that was checked'),
    'is_spam': fields.Boolean(description='Whether the text was spam or not'),
    'confidence': fields.Float(description='Confidence score of the prediction'),
    'timestamp': fields.String(description='When the request was made')
})

error_response = api.model('ErrorResponse', {
    'status': fields.String(description='Error status'),
    'message': fields.String(description='Error message')
})

# Initialize spam detector model
spam_detector = SpamDetector()
spam_detector.load_model()

# Custom decorator for optional JWT authentication
def jwt_optional(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            kwargs['user_id'] = get_jwt_identity()
        except:
            kwargs['user_id'] = None
        return fn(*args, **kwargs)
    return wrapper

# Root endpoint
@api.route('/')
class Home(Resource):
    @api.doc(responses={200: 'Success'})
    def get(self):
        """Check if the API is running"""
        return {
            "status": "success",
            "message": "Spam Detection API is running"
        }

# Spam detection endpoint
@ns.route('/check-spam')
class SpamCheck(Resource):
    @api.doc(
        responses={
            200: 'Success',
            400: 'Validation Error',
            401: 'Unauthorized',
            429: 'Too Many Requests',
            500: 'Internal Server Error'
        },
        security=[{'apikey': []}]
    )
    @api.expect(spam_request)
    @api.marshal_with(spam_response, code=200)
    @jwt_optional
    def post(self, user_id=None):
        """Check if the provided text is spam"""
        data = request.get_json()
        
        if not data or 'text' not in data:
            api.abort(400, "No text provided")
        
        text = data['text']
        
        # Check if authenticated
        if user_id is None:
            # Guest user - check rate limit
            if not check_guest_limit():
                api.abort(429, "Rate limit exceeded. Please register for unlimited access.")
        
        # Get prediction
        is_spam, confidence = spam_detector.predict(text)
        
        # Save to history if authenticated
        if user_id is not None:
            history = RequestHistory(
                user_id=user_id,
                text=text,
                is_spam=is_spam,
                confidence=confidence
            )
            db.session.add(history)
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

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port) 