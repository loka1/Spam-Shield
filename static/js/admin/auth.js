document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is logged in and is admin
    await checkAdminStatus();

    // Logout button event listener
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

async function checkAdminStatus() {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
        // Redirect to login page
        window.location.href = '/login?redirect=/admin';
        return;
    }
    
    try {
        const profileUrl = await getApiUrl('auth', 'profile');
        const response = await fetch(profileUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }
        
        const data = await response.json();
        
        // Check if user is admin
        if (!data.user.is_admin) {
            showAdminAlert('You do not have admin privileges', 'danger');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
            return;
        }
        
        // Display username
        const usernameElement = document.getElementById('admin-username');
        if (usernameElement) {
            usernameElement.textContent = data.user.username;
        }
        
    } catch (error) {
        console.error('Admin auth error:', error);
        showAdminAlert('Authentication error', 'danger');
        setTimeout(() => {
            window.location.href = '/login?redirect=/admin';
        }, 2000);
    }
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    
    // Redirect to login page
    window.location.href = '/login';
}

function showAdminAlert(message, type = 'info') {
    const alertContainer = document.getElementById('admin-alert-container');
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