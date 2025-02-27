import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from model.spam_model import SpamDetector
from flask_restx import Api, Resource, fields

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize Flask-RESTx
api = Api(
    app,
    version='1.0',
    title='Spam Detection API',
    description='A simple API for detecting spam text for Flutter applications',
    doc='/docs'
)

# Create namespaces
ns = api.namespace('api', description='Spam detection operations')

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

error_response = api.model('ErrorResponse', {
    'status': fields.String(description='Error status'),
    'message': fields.String(description='Error message')
})

# Initialize spam detector model
spam_detector = SpamDetector()
spam_detector.load_model()

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
    @api.doc(responses={
        200: 'Success',
        400: 'Validation Error',
        500: 'Internal Server Error'
    })
    @api.expect(spam_request)
    @api.marshal_with(spam_response, code=200)
    def post(self):
        """Check if the provided text is spam"""
        data = request.get_json()
        
        if not data or 'text' not in data:
            api.abort(400, "No text provided")
        
        text = data['text']
        
        # Get prediction
        is_spam, confidence = spam_detector.predict(text)
        
        return {
            "status": "success",
            "is_spam": bool(is_spam),
            "confidence": float(confidence),
            "text": text
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