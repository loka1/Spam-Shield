from flask import request, current_app
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt_identity
from datetime import datetime, timedelta
from database.models import User, GuestRequest, db
import ipaddress

def get_client_ip():
    """Get the client's IP address from the request"""
    if request.headers.getlist("X-Forwarded-For"):
        # If behind a proxy, get the real IP
        ip = request.headers.getlist("X-Forwarded-For")[0]
    else:
        ip = request.remote_addr or '127.0.0.1'
    
    # Validate IP address format
    try:
        ipaddress.ip_address(ip)
        return ip
    except ValueError:
        return '127.0.0.1'  # Default to localhost if invalid

def check_guest_limit():
    """Check if a guest user has exceeded their request limit"""
    ip = get_client_ip()
    guest = GuestRequest.query.filter_by(ip_address=ip).first()
    
    if not guest:
        # Create new guest record
        guest = GuestRequest(ip_address=ip, request_count=1)
        db.session.add(guest)
        db.session.commit()
        return True
    
    # Check if we need to reset the counter (daily)
    now = datetime.utcnow()
    if (now - guest.last_reset) > timedelta(days=1):
        guest.request_count = 1
        guest.last_reset = now
        db.session.commit()
        return True
    
    # Check if limit exceeded
    if guest.request_count >= current_app.config['GUEST_REQUESTS_LIMIT']:
        return False
    
    # Increment counter
    guest.request_count += 1
    db.session.commit()
    return True

def generate_tokens(user_id):
    """Generate access and refresh tokens for a user"""
    access_token = create_access_token(identity=user_id)
    refresh_token = create_refresh_token(identity=user_id)
    return access_token, refresh_token 