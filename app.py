import os
from flask import Flask, request, jsonify, render_template, url_for, redirect, make_response
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
from auth.utils import check_guest_limit, admin_required
from functools import wraps
from routes import *  # Import route constants
from datetime import datetime, timedelta

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

@app.route(ROUTE_ABOUT, endpoint='frontend_about')
def about_page():
    """About Us page"""
    return render_template('about.html')

@app.route(ROUTE_PROFILE, endpoint='frontend_profile')
def profile_page():
    """Profile page for authenticated users"""
    return render_template('profile.html')

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
            'demo_admin_token': f"{base_url}/auth/demo-admin-token",
        },
        'api': {
            'check_spam': f"{base_url}/api/check-spam",
            'history': f"{base_url}/api/history",
            'example_spam': f"{base_url}/api/example/spam",
            'example_ham': f"{base_url}/api/example/ham",
        },
        'admin': {
            'stats': f"{base_url}/api/admin/stats",
            'detailed_stats': f"{base_url}/api/admin/stats/detailed",
            'users': f"{base_url}/api/admin/users",
            'users_list': f"{base_url}/api/admin/users/list",
            'requests': f"{base_url}/api/admin/requests",
            'export_requests': f"{base_url}/api/admin/requests/export",
        },
        'frontend': {
            'root': f"{base_url}/",
            'index': f"{base_url}/app",
            'check': f"{base_url}/check",
            'login': f"{base_url}/login",
            'register': f"{base_url}/register",
            'history': f"{base_url}/history",
            'about': f"{base_url}/about",
            'profile': f"{base_url}/profile",
            'admin': f"{base_url}/admin",
            'admin_dashboard': f"{base_url}/admin/dashboard",
            'admin_users': f"{base_url}/admin/users",
            'admin_requests': f"{base_url}/admin/requests",
            'admin_stats': f"{base_url}/admin/stats",
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
class CheckSpam(Resource):
    @ns.doc(
        description="Check if text is spam",
        responses={200: 'Success'}
    )
    @ns.expect(spam_request)
    @ns.marshal_with(spam_response, code=200)
    @jwt_optional
    def post(self):
        """Check if text is spam"""
        # Get request data
        data = request.get_json()
        text = data.get('text', '')
        
        # Check if text is empty
        if not text:
            return {
                "status": "error",
                "message": "Text cannot be empty"
            }, 400
        
        # Get user ID if authenticated
        user_id = None
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
        except Exception:
            # Check guest limit
            if not check_guest_limit(request.remote_addr):
                return {
                    "status": "error",
                    "message": "Guest daily limit exceeded. Please login or try again tomorrow."
                }, 429
        
        # Predict if text is spam
        is_spam, confidence = spam_detector.predict(text)
        
        # Save to history if user is authenticated
        if user_id:
            request_history = RequestHistory(
                user_id=user_id,
                text=text,
                is_spam=bool(is_spam),  # Convert NumPy bool_ to Python bool
                confidence=float(confidence)  # Convert NumPy float to Python float
            )
            db.session.add(request_history)
            db.session.commit()
        
        return {
            "status": "success",
            "is_spam": bool(is_spam),  # Convert NumPy bool_ to Python bool
            "confidence": float(confidence),  # Convert NumPy float to Python float
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
    @ns.doc(
        description="Get an example of spam text",
        responses={200: 'Success'}
    )
    def get(self):
        """Get an example of spam text"""
        example = spam_detector.get_example(is_spam=True)
        
        # Add a subject line to make it more email-like
        subject = "URGENT: Action Required - Account Verification"
        example_with_subject = f"Subject: {subject}\n\n{example}"
        
        is_spam, confidence = spam_detector.predict(example_with_subject)
        
        return {
            'text': example_with_subject,
            'is_spam': bool(is_spam),
            'confidence': float(confidence)
        }

@ns.route('/example/ham')
class HamExample(Resource):
    @ns.doc(
        description="Get an example of non-spam (ham) text",
        responses={200: 'Success'}
    )
    def get(self):
        """Get an example of non-spam text"""
        example = spam_detector.get_example(is_spam=False)
        
        # Add a subject line to make it more email-like
        subject = "Meeting Notes - Project Update"
        example_with_subject = f"Subject: {subject}\n\n{example}"
        
        is_spam, confidence = spam_detector.predict(example_with_subject)
        
        return {
            'text': example_with_subject,
            'is_spam': bool(is_spam),
            'confidence': float(confidence)
        }

# Admin routes
@app.route(ROUTE_ADMIN, endpoint='admin_index')
def admin_index():
    """Admin index page - redirects to dashboard"""
    # Check if token is in URL parameter (for redirects from login)
    token = request.args.get('token')
    
    if token:
        # If token is provided, redirect with token
        return redirect(url_for('admin_dashboard', token=token))
    
    # Otherwise, just redirect to dashboard (JWT will be checked there)
    return redirect(url_for('admin_dashboard'))

@app.route(ROUTE_ADMIN_DASHBOARD, endpoint='admin_dashboard')
def admin_dashboard():
    """Admin dashboard page"""
    # We'll check the JWT in JavaScript instead of here
    return render_template('admin/dashboard.html')

@app.route(ROUTE_ADMIN_USERS, endpoint='admin_users')
def admin_users():
    """Admin users management page"""
    return render_template('admin/users.html')

@app.route(ROUTE_ADMIN_REQUESTS, endpoint='admin_requests')
def admin_requests():
    """Admin requests management page"""
    return render_template('admin/requests.html')

@app.route(ROUTE_ADMIN_STATS, endpoint='admin_stats')
def admin_stats():
    """Admin statistics page"""
    return render_template('admin/stats.html')

# Admin API endpoints
@app.route('/api/admin/requests', methods=['GET'])
@jwt_required()
@admin_required()
def admin_api_requests():
    """Get requests with pagination and filtering"""
    # Get query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    user_id = request.args.get('user_id', type=int)
    result = request.args.get('result')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    # Build query
    query = db.session.query(
        RequestHistory, User.username
    ).join(
        User, RequestHistory.user_id == User.id
    )
    
    # Apply filters
    if user_id:
        query = query.filter(RequestHistory.user_id == user_id)
    
    if result:
        if result.lower() == 'spam':
            query = query.filter(RequestHistory.is_spam == True)
        elif result.lower() == 'ham':
            query = query.filter(RequestHistory.is_spam == False)
    
    if date_from:
        date_from = datetime.strptime(date_from, '%Y-%m-%d')
        query = query.filter(RequestHistory.timestamp >= date_from)
    
    if date_to:
        date_to = datetime.strptime(date_to, '%Y-%m-%d')
        date_to = date_to + timedelta(days=1)  # Include the end date
        query = query.filter(RequestHistory.timestamp < date_to)
    
    # Order by timestamp (newest first)
    query = query.order_by(RequestHistory.timestamp.desc())
    
    # Paginate
    total = query.count()
    pages = (total + per_page - 1) // per_page
    offset = (page - 1) * per_page
    requests_page = query.offset(offset).limit(per_page).all()
    
    # Format requests
    formatted_requests = []
    for req, username in requests_page:  # Renamed 'request' to 'req' to avoid shadowing
        formatted_requests.append({
            'id': req.id,
            'user_id': req.user_id,
            'username': username,
            'text': req.text,
            'is_spam': req.is_spam,
            'confidence': req.confidence,
            'timestamp': req.timestamp.isoformat()
        })
    
    return jsonify({
        'requests': formatted_requests,
        'page': page,
        'pages': pages,
        'per_page': per_page,
        'total': total
    })

@app.route('/api/admin/stats', methods=['GET'])
@jwt_required()
@admin_required()
def admin_api_stats():
    """Get basic statistics for the admin dashboard"""
    # Get user stats
    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    new_users_today = User.query.filter(
        User.created_at >= datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    ).count()
    
    # Get request stats
    total_requests = RequestHistory.query.count()
    spam_requests = RequestHistory.query.filter_by(is_spam=True).count()
    ham_requests = RequestHistory.query.filter_by(is_spam=False).count()
    
    # Calculate spam rate
    spam_rate = 0
    if total_requests > 0:
        spam_rate = (spam_requests / total_requests) * 100
    
    # Get recent users
    recent_users = User.query.order_by(User.created_at.desc()).limit(5).all()
    
    # Get recent requests
    recent_requests = db.session.query(
        RequestHistory, User.username
    ).join(
        User, RequestHistory.user_id == User.id
    ).order_by(
        RequestHistory.timestamp.desc()
    ).limit(5).all()
    
    # Format recent requests
    formatted_recent_requests = []
    for request, username in recent_requests:
        formatted_recent_requests.append({
            'id': request.id,
            'username': username,
            'text': request.text[:50] + ('...' if len(request.text) > 50 else ''),
            'is_spam': request.is_spam,
            'confidence': request.confidence,
            'timestamp': request.timestamp.isoformat()
        })
    
    # Get API usage over time (last 7 days)
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=7)
    
    # Query requests by day
    daily_requests = db.session.query(
        db.func.date(RequestHistory.timestamp).label('date'),
        db.func.count().label('count')
    ).filter(
        RequestHistory.timestamp >= start_date,
        RequestHistory.timestamp <= end_date
    ).group_by(
        db.func.date(RequestHistory.timestamp)
    ).order_by(
        db.func.date(RequestHistory.timestamp)
    ).all()
    
    # Format API usage data
    api_usage = {
        'labels': [],
        'values': []
    }
    
    # Create a dictionary of date -> count for easy lookup
    date_counts = {str(date): count for date, count in daily_requests}
    
    # Fill in all dates in the range, even if no requests
    current_date = start_date
    while current_date <= end_date:
        date_str = current_date.strftime('%Y-%m-%d')
        api_usage['labels'].append(date_str)
        api_usage['values'].append(date_counts.get(date_str, 0))
        current_date += timedelta(days=1)
    
    return jsonify({
        'user_stats': {
            'total': total_users,
            'active': active_users,
            'new_today': new_users_today
        },
        'request_stats': {
            'total': total_requests,
            'spam': spam_requests,
            'ham': ham_requests,
            'spam_rate': round(spam_rate, 1)
        },
        'recent_users': [user.to_dict() for user in recent_users],
        'recent_requests': formatted_recent_requests,
        'api_usage': api_usage
    })

@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
@admin_required()
def admin_api_users():
    """Get users with pagination"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Get users with pagination
    users_pagination = User.query.order_by(User.id).paginate(page=page, per_page=per_page)
    
    return jsonify({
        'users': [user.to_dict() for user in users_pagination.items],
        'page': users_pagination.page,
        'pages': users_pagination.pages,
        'per_page': users_pagination.per_page,
        'total': users_pagination.total
    })

@app.route('/api/admin/users/<int:user_id>', methods=['GET'])
@jwt_required()
@admin_required()
def admin_api_get_user(user_id):
    """Get a specific user"""
    user = User.query.get_or_404(user_id)
    
    return jsonify(user.to_dict())

@app.route('/api/admin/users', methods=['POST'])
@jwt_required()
@admin_required()
def admin_api_add_user():
    """Add a new user"""
    data = request.json
    
    # Validate input
    if not data or not all(k in data for k in ('username', 'email', 'password')):
        return jsonify({
            'status': 'error',
            'message': 'Missing required fields'
        }), 400
    
    # Check if username or email already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({
            'status': 'error',
            'message': 'Username already exists'
        }), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({
            'status': 'error',
            'message': 'Email already exists'
        }), 400
    
    # Create new user
    user = User(
        username=data['username'],
        email=data['email'],
        is_admin=data.get('is_admin', False)
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'status': 'success',
        'message': 'User created successfully',
        'user': user.to_dict()
    }), 201

@app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
@jwt_required()
@admin_required()
def admin_api_update_user(user_id):
    """Update a user"""
    user = User.query.get_or_404(user_id)
    data = request.json
    
    # Update username if provided and not already taken
    if 'username' in data and data['username'] != user.username:
        if User.query.filter_by(username=data['username']).first():
            return jsonify({
                'status': 'error',
                'message': 'Username already exists'
            }), 400
        user.username = data['username']
    
    # Update email if provided and not already taken
    if 'email' in data and data['email'] != user.email:
        if User.query.filter_by(email=data['email']).first():
            return jsonify({
                'status': 'error',
                'message': 'Email already exists'
            }), 400
        user.email = data['email']
    
    # Update password if provided
    if 'password' in data and data['password']:
        user.set_password(data['password'])
    
    # Update admin status if provided
    if 'is_admin' in data:
        user.is_admin = data['is_admin']
    
    db.session.commit()
    
    return jsonify({
        'status': 'success',
        'message': 'User updated successfully',
        'user': user.to_dict()
    })

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@admin_required()
def admin_api_delete_user(user_id):
    """Delete a user"""
    user = User.query.get_or_404(user_id)
    
    # Don't allow deleting the current user
    current_user_id = get_jwt_identity()
    if user_id == current_user_id:
        return jsonify({
            'status': 'error',
            'message': 'Cannot delete your own account'
        }), 400
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({
        'status': 'success',
        'message': 'User deleted successfully'
    })

@app.route('/api/admin/users/list', methods=['GET'])
@jwt_required()
@admin_required()
def admin_api_users_list():
    """Get a simple list of all users (for dropdowns)"""
    users = User.query.all()
    
    return jsonify([{
        'id': user.id,
        'username': user.username
    } for user in users])

@app.route('/api/admin/stats/detailed', methods=['GET'])
@jwt_required()
@admin_required()
def admin_api_detailed_stats():
    """Get detailed statistics for the stats page"""
    # Get spam vs ham distribution
    spam_count = RequestHistory.query.filter_by(is_spam=True).count()
    ham_count = RequestHistory.query.filter_by(is_spam=False).count()
    
    # Get user registration over time (by month)
    # Use strftime which is supported by SQLite
    user_registrations = db.session.query(
        db.func.strftime('%Y-%m', User.created_at).label('month'),
        db.func.count().label('count')
    ).group_by(
        db.func.strftime('%Y-%m', User.created_at)
    ).order_by(
        db.func.strftime('%Y-%m', User.created_at)
    ).all()
    
    # Format user registration data
    user_registration_data = {
        'labels': [],
        'values': []
    }
    
    for month, count in user_registrations:
        user_registration_data['labels'].append(month)
        user_registration_data['values'].append(count)
    
    # Get confidence distribution (in ranges)
    confidence_ranges = [
        {'min': 0.0, 'max': 0.2, 'label': '0-20%', 'count': 0},
        {'min': 0.2, 'max': 0.4, 'label': '20-40%', 'count': 0},
        {'min': 0.4, 'max': 0.6, 'label': '40-60%', 'count': 0},
        {'min': 0.6, 'max': 0.8, 'label': '60-80%', 'count': 0},
        {'min': 0.8, 'max': 1.0, 'label': '80-100%', 'count': 0}
    ]
    
    # Count requests in each confidence range
    for range_data in confidence_ranges:
        range_data['count'] = RequestHistory.query.filter(
            RequestHistory.confidence >= range_data['min'],
            RequestHistory.confidence <= range_data['max']
        ).count()
    
    # Format confidence distribution data
    confidence_distribution = {
        'labels': [r['label'] for r in confidence_ranges],
        'values': [r['count'] for r in confidence_ranges]
    }
    
    # Get top spam patterns (simplified - in a real app, you'd use NLP)
    # This is a placeholder implementation
    spam_requests = RequestHistory.query.filter_by(is_spam=True).limit(100).all()
    
    # Extract common words (very simplified)
    word_counts = {}
    for request in spam_requests:
        words = request.text.lower().split()
        for word in words:
            if len(word) > 3:  # Skip short words
                if word not in word_counts:
                    word_counts[word] = {'count': 0, 'confidence_sum': 0}
                word_counts[word]['count'] += 1
                word_counts[word]['confidence_sum'] += request.confidence
    
    # Sort by count and get top 10
    top_patterns = []
    for word, data in sorted(word_counts.items(), key=lambda x: x[1]['count'], reverse=True)[:10]:
        avg_confidence = data['confidence_sum'] / data['count'] if data['count'] > 0 else 0
        top_patterns.append({
            'pattern': word,
            'occurrences': data['count'],
            'avg_confidence': avg_confidence
        })
    
    return jsonify({
        'spam_distribution': {
            'labels': ['Spam', 'Not Spam'],
            'values': [spam_count, ham_count]
        },
        'user_registration': user_registration_data,
        'confidence_distribution': confidence_distribution,
        'top_patterns': top_patterns
    })

@app.route('/api/admin/requests/export', methods=['GET'])
@jwt_required()
@admin_required()
def admin_api_export_requests():
    """Export requests as CSV"""
    # Get all requests
    requests = db.session.query(
        RequestHistory, User.username
    ).join(
        User, RequestHistory.user_id == User.id
    ).order_by(
        RequestHistory.timestamp.desc()
    ).all()
    
    # Create CSV content
    csv_content = "ID,User,Text,Is Spam,Confidence,Timestamp\n"
    
    for request, username in requests:
        # Escape text for CSV
        text = request.text.replace('"', '""')
        
        csv_content += f"{request.id},{username},\"{text}\",{request.is_spam},{request.confidence},{request.timestamp}\n"
    
    # Create response
    response = make_response(csv_content)
    response.headers['Content-Disposition'] = 'attachment; filename=requests.csv'
    response.headers['Content-Type'] = 'text/csv'
    
    return response

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

@app.route('/docs', endpoint='api_docs')
def api_docs_redirect():
    return redirect('/docs')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port) 