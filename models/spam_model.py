import os
import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
import random

class SpamDetector:
    def __init__(self):
        self.model = None
        self.model_path = os.path.join(os.path.dirname(__file__), 'spam_classifier.pkl')
        
        # Initialize example messages
        self.spam_examples = [
            "URGENT: Your email account will be suspended. Verify your details at http://suspicious-link.com",
            "Congratulations! You've won a $5,000 Amazon gift card. Click here to claim your prize now!",
            "ATTENTION: Your PayPal account has been limited. Login at http://paypal-secure-login.com to restore access.",
            "Dear customer, your bank account has been compromised. Please verify your information immediately.",
            "You have received a new invoice. Download attachment to view details.",
            "Your package delivery failed. Click here to reschedule or your item will be returned.",
            "FINAL NOTICE: Your tax refund of $4,829.00 is pending. Submit your details within 24 hours.",
            "Hot singles in your area want to meet you! Click here for free membership.",
            "Increase your performance in bed with this miracle pill. 90% off today only!",
            "Your inheritance of $5.2M is ready for transfer. Contact us with your bank details."
        ]
        
        self.ham_examples = [
            "Hi Sarah, can you send me the meeting notes from yesterday? Thanks!",
            "Your monthly account statement is now available. Log in to your secure portal to view.",
            "Thank you for your order #12345. Your items have been shipped and will arrive on Friday.",
            "Reminder: Team meeting tomorrow at 10am in Conference Room B.",
            "Hi Dad, I'll be home for dinner around 6pm. Can you pick me up from the station?",
            "Your subscription to Netflix will renew on 05/15/2025. No action is required.",
            "Professor Smith has posted new course materials for CS401. Check the learning portal.",
            "Your flight to New York has been confirmed. Check-in opens 24 hours before departure.",
            "The document you requested is attached. Let me know if you need anything else.",
            "Happy birthday! Wishing you all the best on your special day."
        ]
    
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
        # Create training data
        X_train = self.spam_examples + self.ham_examples
        y_train = [1] * len(self.spam_examples) + [0] * len(self.ham_examples)
        
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
    
    def get_example(self, is_spam=True):
        """
        Get an example of spam or ham text
        
        Args:
            is_spam (bool): Whether to return a spam or ham example
            
        Returns:
            str: An example text
        """
        if self.model is None:
            self.load_model()
        
        # Return a random example from the appropriate list
        return random.choice(self.spam_examples) if is_spam else random.choice(self.ham_examples) 