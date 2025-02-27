document.addEventListener('DOMContentLoaded', function() {
    const spamCheckForm = document.getElementById('spam-check-form');
    const checkAnotherBtn = document.getElementById('check-another-btn');
    const tryExampleBtns = document.querySelectorAll('.try-example');
    
    if (spamCheckForm) {
        spamCheckForm.addEventListener('submit', handleSpamCheck);
    }
    
    if (checkAnotherBtn) {
        checkAnotherBtn.addEventListener('click', resetForm);
    }
    
    if (tryExampleBtns) {
        tryExampleBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const exampleType = this.getAttribute('data-example');
                loadExample(exampleType);
            });
        });
    }
});

async function handleSpamCheck(e) {
    e.preventDefault();
    
    const text = document.getElementById('text').value;
    
    if (!text) {
        showAlert('Please enter some text to check', 'warning');
        return;
    }
    
    // Get token if available
    const token = localStorage.getItem('access_token');
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        // Get check spam URL
        const checkSpamUrl = await getApiUrl('api', 'check_spam');
        
        // Send request to check spam
        const response = await fetch(checkSpamUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                text: text
            })
        });
        
        if (response.status === 429) {
            showAlert('Rate limit exceeded. Please register for unlimited access.', 'warning');
            throw new Error('Rate limit exceeded');
        }
        
        const data = await response.json();
        displayResult(data);
    } catch (error) {
        console.error('Spam check error:', error);
        if (error.message !== 'Rate limit exceeded') {
            showAlert('An error occurred while checking for spam', 'danger');
        }
    }
}

function displayResult(data) {
    const resultCard = document.getElementById('result-card');
    const resultAlert = document.getElementById('result-alert');
    const resultHeading = document.getElementById('result-heading');
    const resultText = document.getElementById('result-text');
    const resultConfidence = document.getElementById('result-confidence');
    const spamCheckForm = document.getElementById('spam-check-form');
    
    // Show result card, hide form
    resultCard.style.display = 'block';
    spamCheckForm.style.display = 'none';
    
    // Update result content
    if (data.is_spam) {
        resultAlert.className = 'alert alert-danger';
        resultHeading.textContent = 'Spam Detected!';
    } else {
        resultAlert.className = 'alert alert-success';
        resultHeading.textContent = 'Not Spam';
    }
    
    resultText.textContent = data.text;
    resultConfidence.textContent = `${(data.confidence * 100).toFixed(2)}%`;
}

function resetForm() {
    const resultCard = document.getElementById('result-card');
    const spamCheckForm = document.getElementById('spam-check-form');
    const textArea = document.getElementById('text');
    
    // Hide result card, show form
    resultCard.style.display = 'none';
    spamCheckForm.style.display = 'block';
    
    // Clear text area
    textArea.value = '';
    
    // Focus on text area
    textArea.focus();
}

function loadExample(type) {
    const textArea = document.getElementById('text');
    
    if (type === 'spam') {
        textArea.value = "Congratulations! You've won a free gift card. Click here to claim your prize now!";
    } else if (type === 'ham') {
        textArea.value = "Hey, can we meet tomorrow for coffee at 2pm? Let me know if that works for you.";
    }
    
    // Scroll to form
    textArea.scrollIntoView({ behavior: 'smooth' });
    
    // Focus on text area
    textArea.focus();
} 