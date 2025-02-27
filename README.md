# Spam Detection API with Web UI

A simple API and web interface for detecting spam text messages using machine learning.

## Features

- **Spam Detection**: Check if a text message is spam or not
- **User Authentication**: Register, login, and manage your account
- **History Tracking**: View your past spam checks (for authenticated users)
- **Rate Limiting**: Guest users are limited to 10 requests per day
- **API Documentation**: Interactive Swagger UI documentation
- **Responsive Web UI**: Works on desktop and mobile devices
- **Admin Panel**: Comprehensive admin interface for managing users and viewing statistics

## Demo

A demo account is available for quick testing:
- Username: `demo`
- Password: `password123`

A demo admin account is also available:
- Username: `demoadmin`
- Password: `adminpassword123`

Or use the "Demo Login" or "Demo Admin Login" buttons on the login page.

## API Usage

### Authentication

- **Guest access**: Limited to 10 requests per day
- **Authenticated access**: Unlimited requests with history tracking

Add the header: `Authorization: Bearer your-token` to your requests

### Endpoints

- `POST /api/check-spam`: Check if text is spam
- `GET /api/history`: Get user's spam check history (requires authentication)
- `GET /api/example/spam`: Get an example of spam detection for a typical spam message
- `GET /api/example/ham`: Get an example of spam detection for a typical non-spam message
- `POST /auth/register`: Register a new user
- `POST /auth/login`: Login a user
- `POST /auth/refresh`: Refresh access token
- `GET /auth/profile`: Get user profile (requires authentication)
- `GET /auth/demo-token`: Get a token for the demo user (for quick testing)
- `GET /auth/demo-admin-token`: Get a token for the demo admin user (for quick testing)

## Web UI

The web UI provides a user-friendly interface for the API:

- **Home Page**: Information about the service
- **Check Spam**: Test messages for spam
- **History**: View your spam check history (requires authentication)
- **Login/Register**: Create an account or login
- **API Docs**: Interactive API documentation

## Admin Panel

The application includes an admin panel for managing users and viewing statistics:

### Admin Features

- **Dashboard**: Overview of users, requests, and spam detection rate
- **User Management**: Add, edit, and delete users
- **Request History**: View and filter all spam check requests
- **Statistics**: View charts and statistics about spam detection

### Admin Access

Only users with admin privileges can access the admin panel. To create an admin user:

```
python scripts/create_admin.py <username> <email> <password>
```

For quick testing, use the demo admin account or the "Demo Admin Login" button on the login page.

## Technologies Used

- **Backend**: Flask, Flask-RESTx, SQLAlchemy, JWT
- **Frontend**: HTML, CSS, JavaScript, Bootstrap, Chart.js
- **Machine Learning**: Scikit-learn, NLTK
- **Database**: SQLite (development), PostgreSQL (production)

## Development Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/spam-detection-api.git
   cd spam-detection-api
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. Initialize the database:
   ```
   flask db init
   flask db migrate
   flask db upgrade
   ```

6. Create a demo admin user (optional):
   ```
   python scripts/create_demo_admin.py
   ```

7. Run the development server:
   ```
   flask run
   ```

8. Visit http://localhost:5000 in your browser

## Deployment

The application is ready for deployment on platforms like Heroku:

1. Create a new Heroku app:
   ```
   heroku create your-app-name
   ```

2. Add PostgreSQL addon:
   ```
   heroku addons:create heroku-postgresql:hobby-dev
   ```

3. Set environment variables:
   ```
   heroku config:set SECRET_KEY=your-secret-key
   heroku config:set JWT_SECRET_KEY=your-jwt-secret
   ```

4. Deploy the application:
   ```
   git push heroku main
   ```

5. Initialize the database:
   ```
   heroku run flask db upgrade
   ```

6. Create admin users:
   ```
   heroku run python scripts/create_admin.py admin admin@example.com password
   heroku run python scripts/create_demo_admin.py
   ```

## Project Structure

```
spam-detection-api/
├── app.py                  # Main application file
├── config.py               # Configuration settings
├── requirements.txt        # Python dependencies
├── .env.example            # Example environment variables
├── auth/                   # Authentication module
│   ├── __init__.py
│   ├── routes.py           # Auth API endpoints
│   └── utils.py            # Auth utilities
├── database/               # Database module
│   ├── __init__.py
│   └── models.py           # Database models
├── models/                 # ML models
│   └── spam_model.py       # Spam detection model
├── routes.py               # Route constants
├── scripts/                # Utility scripts
│   ├── create_admin.py     # Create admin user
│   └── create_demo_admin.py # Create demo admin
├── static/                 # Static files
│   ├── css/                # CSS files
│   ├── js/                 # JavaScript files
│   └── img/                # Images
└── templates/              # HTML templates
    ├── admin/              # Admin templates
    └── ...                 # Other templates
```

## License

This project is licensed under the MIT License - see the LICENSE file for details. 