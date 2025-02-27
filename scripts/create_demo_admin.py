import os
import sys
from dotenv import load_dotenv

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from database.models import db, User

def create_demo_admin():
    """Create a demo admin user"""
    with app.app_context():
        # Check if demo admin already exists
        demo_admin = User.query.filter_by(username='demoadmin').first()
        
        if demo_admin:
            print("Demo admin user already exists.")
            
            # Make sure the user is an admin
            if not demo_admin.is_admin:
                demo_admin.is_admin = True
                db.session.commit()
                print("Demo admin user has been made an admin.")
            
            return
        
        # Create new demo admin user
        demo_admin = User(
            username='demoadmin',
            email='demoadmin@example.com',
            is_admin=True
        )
        demo_admin.set_password('adminpassword123')
        
        db.session.add(demo_admin)
        db.session.commit()
        
        print("Demo admin user created successfully.")
        print("Username: demoadmin")
        print("Password: adminpassword123")

if __name__ == '__main__':
    load_dotenv()
    create_demo_admin() 