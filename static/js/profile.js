document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    
    // Load profile data
    loadProfileData();
    
    // Add event listeners for buttons
    const changePasswordBtn = document.getElementById('change-password-btn');
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const savePasswordBtn = document.getElementById('save-password-btn');
    
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', showChangePasswordModal);
    }
    
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', confirmDeleteAccount);
    }
    
    if (savePasswordBtn) {
        savePasswordBtn.addEventListener('click', changePassword);
    }
});

async function loadProfileData() {
    const token = localStorage.getItem('access_token');
    
    try {
        // Get profile URL
        const profileUrl = await getApiUrl('auth', 'profile');
        
        // Fetch profile data
        const response = await fetch(profileUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch profile data');
        }
        
        const data = await response.json();
        
        // Update profile information
        updateProfileInfo(data);
        
        // Load usage statistics
        loadUsageStats();
        
    } catch (error) {
        console.error('Profile error:', error);
        showAlert('Failed to load profile data. Please try again later.', 'danger');
    }
}

function updateProfileInfo(data) {
    // Update profile fields
    document.getElementById('profile-username').textContent = data.username;
    document.getElementById('profile-email').textContent = data.email;
    document.getElementById('profile-type').textContent = data.is_admin ? 'Administrator' : 'User';
    
    // Format and display creation date
    const createdDate = new Date(data.created_at).toLocaleDateString();
    document.getElementById('profile-created').textContent = createdDate;
}

async function loadUsageStats() {
    const token = localStorage.getItem('access_token');
    
    try {
        // Get history URL
        const historyUrl = await getApiUrl('api', 'history');
        
        // Fetch history data
        const response = await fetch(historyUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch usage statistics');
        }
        
        const data = await response.json();
        
        // Calculate statistics
        const totalChecks = data.history.length;
        const spamChecks = data.history.filter(item => item.is_spam).length;
        const hamChecks = totalChecks - spamChecks;
        
        // Update statistics display
        document.getElementById('stats-total').textContent = totalChecks;
        document.getElementById('stats-spam').textContent = spamChecks;
        document.getElementById('stats-ham').textContent = hamChecks;
        
        // Update progress bars
        if (totalChecks > 0) {
            const spamPercentage = (spamChecks / totalChecks) * 100;
            const hamPercentage = (hamChecks / totalChecks) * 100;
            
            document.getElementById('stats-spam-bar').style.width = `${spamPercentage}%`;
            document.getElementById('stats-ham-bar').style.width = `${hamPercentage}%`;
        }
        
    } catch (error) {
        console.error('Statistics error:', error);
        showAlert('Failed to load usage statistics. Please try again later.', 'danger');
    }
}

function showChangePasswordModal() {
    // Clear previous form data
    document.getElementById('change-password-form').reset();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
    modal.show();
}

async function changePassword() {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
        showAlert('New passwords do not match', 'danger');
        return;
    }
    
    try {
        // Get profile URL
        const profileUrl = await getApiUrl('auth', 'profile');
        
        // Send password change request
        const response = await fetch(`${profileUrl}/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to change password');
        }
        
        // Hide modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
        modal.hide();
        
        // Show success message
        showAlert('Password changed successfully', 'success');
        
    } catch (error) {
        console.error('Password change error:', error);
        showAlert('Failed to change password. Please check your current password and try again.', 'danger');
    }
}

function confirmDeleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        deleteAccount();
    }
}

async function deleteAccount() {
    try {
        // Get profile URL
        const profileUrl = await getApiUrl('auth', 'profile');
        
        // Send delete request
        const response = await fetch(profileUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete account');
        }
        
        // Clear local storage
        localStorage.removeItem('access_token');
        
        // Show success message
        showAlert('Your account has been deleted successfully', 'success');
        
        // Redirect to home page after a short delay
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
        
    } catch (error) {
        console.error('Account deletion error:', error);
        showAlert('Failed to delete account. Please try again later.', 'danger');
    }
} 