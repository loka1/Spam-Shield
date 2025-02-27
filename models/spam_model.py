import os
import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

class SpamDetector:
    def __init__(self):
        self.model = None
        self.model_path = os.path.join(os.path.dirname(__file__), 'spam_classifier.pkl')
    
    def load_model(self):
        """Load the pre-trained model or train a new one if it doesn't exist"""
        if os.path.exists(self.model_path):
            with open(self.model_path, 'rb') as f:
                self.model = pickle.load(f)
            print("Model loaded successfully")
        else:
            print("No pre-trained model found. Training a new model...")
            self.train_model()
    
    def train_model(self):
        """Train a simple spam detection model"""
        # Sample data for training
        spam_messages = [
            "Congratulations! You've won a free gift card",
            "URGENT: Your account has been compromised",
            "You have won $1,000,000 in the lottery",
            "Click here to claim your prize now",
            "Limited time offer: 90% discount",
            "Buy now, limited stock available",
            "Your payment has been declined",
            "Verify your account immediately",
            "You've been selected for a special offer",
            "Free money, claim now"
        ]
        
        ham_messages = [
            "Hey, how are you doing?",
            "Can we meet tomorrow for coffee?",
            "I'll be late for the meeting",
            "Please send me the report when you can",
            "Thanks for your help yesterday",
            "What time is the event?",
            "I've finished the project",
            "Let's discuss this in person",
            "Have a great weekend",
            "The weather is nice today"
        ]
        
        # Create training data
        X_train = spam_messages + ham_messages
        y_train = [1] * len(spam_messages) + [0] * len(ham_messages)
        
        # Create and train the model
        self.model = Pipeline([
            ('vectorizer', TfidfVectorizer(lowercase=True, stop_words='english')),
            ('classifier', MultinomialNB())
        ])
        
        self.model.fit(X_train, y_train)
        
        # Save the model
        with open(self.model_path, 'wb') as f:
            pickle.dump(self.model, f)
        
        print("Model trained and saved successfully")
    
    def predict(self, text):
        """
        Predict if a text is spam or not
        
        Args:
            text (str): The text to classify
            
        Returns:
            tuple: (is_spam, confidence)
                is_spam (bool): True if spam, False if not
                confidence (float): Prediction confidence (0-1)
        """
        if self.model is None:
            self.load_model()
        
        # Make prediction
        prediction = self.model.predict([text])[0]
        probabilities = self.model.predict_proba([text])[0]
        
        # Get confidence score
        confidence = probabilities[1] if prediction == 1 else probabilities[0]
        
        return prediction == 1, confidence 