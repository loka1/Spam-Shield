# Spam Detection API

A Flask-based API that provides spam detection services for a Flutter application, with Swagger documentation.

## Repository

This project is available on GitHub: [https://github.com/loka1/spam_detection_api](https://github.com/loka1/spam_detection_api)

## Features

- RESTful API for spam detection
- Simple machine learning model to classify text as spam or not
- Environment variable configuration
- CORS support for Flutter app integration
- Swagger documentation

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/loka1/spam_detection_api.git
   cd spam_detection_api
   ```

2. Create a virtual environment and activate it:
   ```
   python3.8 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file with the following content:
   ```
   FLASK_APP=app.py
   FLASK_ENV=development
   FLASK_DEBUG=1
   PORT=5000
   ```

5. Run the application:
   ```
   flask run
   ```

## API Documentation

The API is documented using Swagger UI. Once the application is running, you can access the documentation at:

```
http://localhost:5000/docs
```

This provides an interactive interface to explore and test the API endpoints.

## API Endpoints

### Check if the API is running
- **URL**: `/`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "status": "success",
    "message": "Spam Detection API is running"
  }
  ```

### Check if text is spam
- **URL**: `/api/check-spam`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "text": "Your text to check for spam"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "is_spam": true,
    "confidence": 0.92,
    "text": "Your text to check for spam"
  }
  ```

### Example Endpoints
- **Spam Example**: `/api/example/spam` (GET)
- **Ham Example**: `/api/example/ham` (GET)

## Model

The spam detection model is a simple Naive Bayes classifier trained on a small dataset. For production use, consider:

1. Training on a larger, more diverse dataset
2. Using more sophisticated models
3. Regular retraining to adapt to new spam patterns

## Flutter Integration

To use this API in your Flutter app, make HTTP requests to the API endpoints. Example:

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<bool> checkIfSpam(String text) async {
  final response = await http.post(
    Uri.parse('http://your-api-url/api/check-spam'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'text': text}),
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return data['is_spam'];
  } else {
    throw Exception('Failed to check spam');
  }
}
```

## Deployment

For production deployment, consider:

1. Using Gunicorn as a WSGI server
2. Setting up behind Nginx
3. Deploying to a cloud platform like Heroku, AWS, or Google Cloud 