# Spam Shield - Email Spam Detection Service


Spam Shield is a modern web application that uses machine learning to detect and protect users from spam emails. Built with Python Flask and modern web technologies, it provides both a user-friendly interface and a robust API for spam detection.

## Features

- 🔍 Real-time spam detection
- 📊 User dashboard with history tracking
- 🔐 Secure user authentication
- 📱 Responsive design
- 🔌 RESTful API
- 👥 User management
- 📈 Analytics dashboard for admins

## Tech Stack

### Backend
- Python 3.8+
- Flask
- SQLAlchemy
- JWT Authentication
- Machine Learning (scikit-learn)

### Frontend
- HTML5 & CSS3
- JavaScript (ES6+)
- Bootstrap 5
- Bootstrap Icons

## Getting Started

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- Virtual environment (recommended)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/spam-shield.git
cd spam-shield
```

2. Create and activate virtual environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies
```bash
pip install -r requirements.txt
```

4. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Initialize the database
```bash
flask db upgrade
```

6. Run the application
```bash
flask run
```

The application will be available at `http://localhost:5000`

## API Documentation

### Authentication
All API endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_token>
```

### Endpoints

#### Check Email
```http
POST /api/check-spam
Content-Type: application/json

{
    "text": "Email content to check",
    "subject": "Optional email subject"
}
```

#### Get History
```http
GET /api/history
```

For complete API documentation, visit `/docs` when running the application.

## Project Structure
```
spam-shield/
├── app/
│   ├── __init__.py
│   ├── models/
│   ├── routes/
│   └── services/
├── static/
│   ├── css/
│   ├── js/
│   └── img/
├── templates/
├── tests/
├── .env.example
├── requirements.txt
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- Email: support@spamshield.com
- Website: https://spamshield.com
- GitHub: [Your GitHub Profile](https://github.com/loka1)

## Acknowledgments

- Bootstrap team for the amazing UI framework
- Flask team for the excellent web framework
- All contributors who have helped with the project 
