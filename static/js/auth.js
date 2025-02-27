document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is logged in
    await checkAuthStatus();

    // Logout button event listener
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

// Function to check authentication status
async function checkAuthStatus() {
    const token = localStorage.getItem('access_token');
    const userInfo = document.getElementById('user-info');
    const authButtons = document.getElementById('auth-buttons');
    const historyNav = document.getElementById('history-nav');
    const adminNav = document.getElementById('admin-nav');
    
    if (token) {
        // User is logged in
        try {
            const profileUrl = await getApiUrl('auth', 'profile');
            const response = await fetch(profileUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                // Token might be expired or invalid
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                throw new Error('Invalid token');
            }
            
            const data = await response.json();
            
            // Update UI for logged in user
            if (userInfo) userInfo.style.display = 'flex';
            if (authButtons) authButtons.style.display = 'none';
            if (historyNav) historyNav.style.display = 'block';
            
            // Show admin link if user is admin
            if (adminNav) {
                adminNav.style.display = data.user.is_admin ? 'block' : 'none';
            }
            
            // Display username
            const usernameDisplay = document.getElementById('username-display');
            if (usernameDisplay) {
                usernameDisplay.textContent = `Welcome, ${data.user.username}!`;
            }
            
            // Store user data
            localStorage.setItem('user', JSON.stringify(data.user));
        } catch (error) {
            console.error('Auth check error:', error);
            // Show login UI
            if (userInfo) userInfo.style.display = 'none';
            if (authButtons) authButtons.style.display = 'flex';
            if (historyNav) historyNav.style.display = 'none';
            if (adminNav) adminNav.style.display = 'none';
        }
    } else {
        // User is not logged in
        if (userInfo) userInfo.style.display = 'none';
        if (authButtons) authButtons.style.display = 'flex';
        if (historyNav) historyNav.style.display = 'none';
        if (adminNav) adminNav.style.display = 'none';
    }
}

// Function to logout
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    
    // Redirect to root, which will redirect to index
    window.location.href = '/';
}

// Function to show alerts
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.appendChild(alertDiv);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertDiv);
        bsAlert.close();
    }, 5000);
} 