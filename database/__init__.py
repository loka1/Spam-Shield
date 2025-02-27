from .models import db, User, RequestHistory, GuestRequest

def init_app(app):
    db.init_app(app)
    
    with app.app_context():
        db.create_all()
        
        # Create demo user if it doesn't exist
        if not User.query.filter_by(username='demo').first():
            demo_user = User(username='demo', email='demo@example.com')
            demo_user.set_password('password123')
            db.session.add(demo_user)
            db.session.commit()
            print("Demo user created successfully") 