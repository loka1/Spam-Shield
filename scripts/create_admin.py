import os
import sys
from dotenv import load_dotenv

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from database.models import db, User

def create_admin_user(username, email, password):
    """Create an admin user"""
    with app.app_context():
        # Check if user already exists
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            print(f"User '{username}' already exists.")
            
            # Make sure the user is an admin
            if not existing_user.is_admin:
                existing_user.is_admin = True
                db.session.commit()
                print(f"User '{username}' has been made an admin.")
            else:
                print(f"User '{username}' is already an admin.")
                
            return
        
        # Create new admin user
        user = User(
            username=username,
            email=email,
            is_admin=True
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        print(f"Admin user '{username}' created successfully.")

if __name__ == '__main__':
    load_dotenv()
    
    if len(sys.argv) != 4:
        print("Usage: python create_admin.py <username> <email> <password>")
        sys.exit(1)
    
    username = sys.argv[1]
    email = sys.argv[2]
    password = sys.argv[3]
    
    create_admin_user(username, email, password) 