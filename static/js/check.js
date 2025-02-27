document.addEventListener('DOMContentLoaded', function() {
    const spamCheckForm = document.getElementById('spam-check-form');
    const exampleSpamBtn = document.getElementById('example-spam-btn');
    const exampleHamBtn = document.getElementById('example-ham-btn');
    const resultCard = document.getElementById('result-card');
    const emailSubjectInput = document.getElementById('email-subject');
    const emailContentInput = document.getElementById('email-content');
    
    if (spamCheckForm) {
        spamCheckForm.addEventListener('submit', handleSpamCheck);
    }
    
    if (exampleSpamBtn) {
        exampleSpamBtn.addEventListener('click', loadSpamExample);
    }
    
    if (exampleHamBtn) {
        exampleHamBtn.addEventListener('click', loadHamExample);
    }
});

async function handleSpamCheck(e) {
    e.preventDefault();
    
    const emailSubject = document.getElementById('email-subject').value;
    const emailContent = document.getElementById('email-content').value;
    
    // Combine subject and content if subject is provided
    const textToCheck = emailSubject 
        ? `Subject: ${emailSubject}\n\n${emailContent}`
        : emailContent;
    
    if (!textToCheck.trim()) {
        showAlert('Please enter some text to check', 'warning');
        return;
    }
    
    try {
        // Show loading state
        document.getElementById('spam-check-form').querySelector('button[type="submit"]').disabled = true;
        document.getElementById('spam-check-form').querySelector('button[type="submit"]').innerHTML = 
            '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Checking...';
        
        // Get API URL
        const checkSpamUrl = await getApiUrl('api', 'check_spam');
        
        // Get token if available
        const token = localStorage.getItem('access_token');
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Send request
        const response = await fetch(checkSpamUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                text: textToCheck
            })
        });
        
        const data = await response.json();
        
        // Reset button state
        document.getElementById('spam-check-form').querySelector('button[type="submit"]').disabled = false;
        document.getElementById('spam-check-form').querySelector('button[type="submit"]').innerHTML = 'Check for Spam';
        
        if (response.ok) {
            displayResult(data);
        } else {
            showAlert(data.message || 'Error checking spam', 'danger');
        }
    } catch (error) {
        console.error('Spam check error:', error);
        showAlert('An error occurred during spam check', 'danger');
        
        // Reset button state
        document.getElementById('spam-check-form').querySelector('button[type="submit"]').disabled = false;
        document.getElementById('spam-check-form').querySelector('button[type="submit"]').innerHTML = 'Check for Spam';
    }
}

function displayResult(data) {
    const resultIcon = document.getElementById('result-icon');
    const resultTitle = document.getElementById('result-title');
    const confidenceBar = document.getElementById('confidence-bar');
    const confidenceText = document.getElementById('confidence-text');
    const resultExplanation = document.getElementById('result-explanation');
    const resultText = document.getElementById('result-text');
    
    // Set result text
    resultText.textContent = data.text;
    
    // Set confidence
    const confidencePercent = Math.round(data.confidence * 100);
    confidenceBar.style.width = `${confidencePercent}%`;
    confidenceText.textContent = `Confidence: ${confidencePercent}%`;
    
    // Set result based on spam status
    if (data.is_spam) {
        resultIcon.innerHTML = '⚠️';
        resultTitle.textContent = 'Spam Detected';
        resultTitle.className = 'mt-3 text-danger';
        confidenceBar.className = 'progress-bar bg-danger';
        resultExplanation.className = 'alert alert-danger mt-4';
        resultExplanation.innerHTML = `
            <strong>This email appears to be spam.</strong><br>
            Our system has detected characteristics commonly found in spam emails. 
            Be cautious about clicking any links or downloading attachments from this message.
        `;
    } else {
        resultIcon.innerHTML = '✅';
        resultTitle.textContent = 'Legitimate Email';
        resultTitle.className = 'mt-3 text-success';
        confidenceBar.className = 'progress-bar bg-success';
        resultExplanation.className = 'alert alert-success mt-4';
        resultExplanation.innerHTML = `
            <strong>This email appears to be legitimate.</strong><br>
            Our system did not detect any spam characteristics in this message.
            However, always exercise caution with unexpected emails.
        `;
    }
    
    // Show modal
    const resultModal = new bootstrap.Modal(document.getElementById('resultModal'));
    resultModal.show();
}

async function loadSpamExample() {
    try {
        const exampleSpamUrl = await getApiUrl('api', 'example_spam');
        const response = await fetch(exampleSpamUrl);
        const data = await response.json();
        
        if (response.ok) {
            // Extract subject and content if possible
            const text = data.text;
            let subject = '';
            let content = text;
            
            // Try to extract subject if it starts with "Subject:"
            if (text.startsWith('Subject:')) {
                const parts = text.split('\n\n', 2);
                if (parts.length === 2) {
                    subject = parts[0].replace('Subject:', '').trim();
                    content = parts[1];
                }
            }
            
            document.getElementById('email-subject').value = subject;
            document.getElementById('email-content').value = content;
        } else {
            showAlert(data.message || 'Error loading spam example', 'danger');
        }
    } catch (error) {
        console.error('Load spam example error:', error);
        showAlert('An error occurred while loading spam example', 'danger');
    }
}

async function loadHamExample() {
    try {
        const exampleHamUrl = await getApiUrl('api', 'example_ham');
        const response = await fetch(exampleHamUrl);
        const data = await response.json();
        
        if (response.ok) {
            // Extract subject and content if possible
            const text = data.text;
            let subject = '';
            let content = text;
            
            // Try to extract subject if it starts with "Subject:"
            if (text.startsWith('Subject:')) {
                const parts = text.split('\n\n', 2);
                if (parts.length === 2) {
                    subject = parts[0].replace('Subject:', '').trim();
                    content = parts[1];
                }
            }
            
            document.getElementById('email-subject').value = subject;
            document.getElementById('email-content').value = content;
        } else {
            showAlert(data.message || 'Error loading legitimate example', 'danger');
        }
    } catch (error) {
        console.error('Load ham example error:', error);
        showAlert('An error occurred while loading legitimate example', 'danger');
    }
} 