document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkAuthStatus();
    
    // Add event listener to logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Add event listeners to login and register forms if they exist
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Add event listeners to demo login buttons if they exist
    const demoLoginBtn = document.getElementById('demo-login-btn');
    if (demoLoginBtn) {
        demoLoginBtn.addEventListener('click', handleDemoLogin);
    }
    
    const demoAdminLoginBtn = document.getElementById('demo-admin-login-btn');
    if (demoAdminLoginBtn) {
        demoAdminLoginBtn.addEventListener('click', handleDemoAdminLogin);
    }
});

// Check if user is logged in
async function checkAuthStatus() {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
        // User is not logged in
        showAuthButtons(false);
        return;
    }
    
    try {
        // Get profile URL
        const profileUrl = await getApiUrl('auth', 'profile');
        
        // Get user profile
        const response = await fetch(profileUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // User is logged in
            showAuthButtons(true, data.username, data.is_admin);
            
            // Store user data
            localStorage.setItem('user_id', data.id);
            localStorage.setItem('username', data.username);
            localStorage.setItem('is_admin', data.is_admin);
        } else {
            // Token is invalid
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user_id');
            localStorage.removeItem('username');
            localStorage.removeItem('is_admin');
            
            showAuthButtons(false);
        }
    } catch (error) {
        console.error('Auth status check error:', error);
        showAuthButtons(false);
    }
}

// Show/hide auth buttons based on login status
function showAuthButtons(isLoggedIn, username = '', isAdmin = false) {
    const guestElements = document.querySelectorAll('.guest-only');
    const authElements = document.querySelectorAll('.auth-only');
    const authRequired = document.querySelectorAll('.auth-required');
    const adminRequired = document.querySelectorAll('.admin-required');
    const usernameDisplay = document.getElementById('username-display');
    
    if (isLoggedIn) {
        // Show authenticated elements
        guestElements.forEach(el => el.classList.remove('show'));
        authElements.forEach(el => el.classList.add('show'));
        authRequired.forEach(el => el.classList.add('show'));
        
        // Show admin elements if user is admin
        adminRequired.forEach(el => {
            if (isAdmin) {
                el.classList.add('show');
            } else {
                el.classList.remove('show');
            }
        });
        
        // Set username
        if (usernameDisplay) {
            usernameDisplay.textContent = username;
        }
    } else {
        // Show guest elements
        guestElements.forEach(el => el.classList.add('show'));
        authElements.forEach(el => el.classList.remove('show'));
        authRequired.forEach(el => el.classList.remove('show'));
        adminRequired.forEach(el => el.classList.remove('show'));
    }
}

// Handle logout
async function handleLogout(e) {
    e.preventDefault();
    
    // Clear local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('is_admin');
    
    // Update UI
    showAuthButtons(false);
    
    // Show success message
    showAlert('You have been logged out successfully', 'success');
    
    // Redirect to home page after a short delay
    setTimeout(() => {
        window.location.href = '/app';
    }, 1500);
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showAlert('Please enter both username and password', 'warning');
        return;
    }
    
    try {
        // Show loading state
        document.getElementById('login-btn').disabled = true;
        document.getElementById('login-btn').innerHTML = 
            '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';
        
        // Get login URL
        const loginUrl = await getApiUrl('auth', 'login');
        
        // Send login request
        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store tokens
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);
            
            // Show success message
            showAlert('Login successful! Redirecting...', 'success');
            
            // Redirect to home page after a short delay
            setTimeout(() => {
                window.location.href = '/app';
            }, 1500);
        } else {
            // Show error message
            showAlert(data.message || 'Login failed', 'danger');
            
            // Reset loading state
            document.getElementById('login-btn').disabled = false;
            document.getElementById('login-btn').innerHTML = 'Login';
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('An error occurred during login', 'danger');
        
        // Reset loading state
        document.getElementById('login-btn').disabled = false;
        document.getElementById('login-btn').innerHTML = 'Login';
    }
}

// Handle register
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (!username || !email || !password || !confirmPassword) {
        showAlert('Please fill in all fields', 'warning');
        return;
    }
    
    if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'warning');
        return;
    }
    
    try {
        // Show loading state
        document.getElementById('register-btn').disabled = true;
        document.getElementById('register-btn').innerHTML = 
            '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registering...';
        
        // Get register URL
        const registerUrl = await getApiUrl('auth', 'register');
        
        // Send register request
        const response = await fetch(registerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store tokens
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);
            
            // Show success message
            showAlert('Registration successful! Redirecting...', 'success');
            
            // Redirect to home page after a short delay
            setTimeout(() => {
                window.location.href = '/app';
            }, 1500);
        } else {
            // Show error message
            showAlert(data.message || 'Registration failed', 'danger');
            
            // Reset loading state
            document.getElementById('register-btn').disabled = false;
            document.getElementById('register-btn').innerHTML = 'Register';
        }
    } catch (error) {
        console.error('Register error:', error);
        showAlert('An error occurred during registration', 'danger');
        
        // Reset loading state
        document.getElementById('register-btn').disabled = false;
        document.getElementById('register-btn').innerHTML = 'Register';
    }
}

// Handle demo login
async function handleDemoLogin(e) {
    e.preventDefault();
    
    try {
        // Show loading state
        e.target.disabled = true;
        e.target.innerHTML = 
            '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';
        
        // Get demo token URL
        const demoTokenUrl = await getApiUrl('auth', 'demo_token');
        
        // Send request
        const response = await fetch(demoTokenUrl);
        const data = await response.json();
        
        if (response.ok) {
            // Store tokens
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);
            
            // Show success message
            showAlert('Demo login successful! Redirecting...', 'success');
            
            // Redirect to home page after a short delay
            setTimeout(() => {
                window.location.href = '/app';
            }, 1500);
        } else {
            // Show error message
            showAlert(data.message || 'Demo login failed', 'danger');
            
            // Reset loading state
            e.target.disabled = false;
            e.target.innerHTML = 'Demo Login';
        }
    } catch (error) {
        console.error('Demo login error:', error);
        showAlert('An error occurred during demo login', 'danger');
        
        // Reset loading state
        e.target.disabled = false;
        e.target.innerHTML = 'Demo Login';
    }
}

// Handle demo admin login
async function handleDemoAdminLogin(e) {
    e.preventDefault();
    
    try {
        // Show loading state
        e.target.disabled = true;
        e.target.innerHTML = 
            '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';
        
        // Get demo admin token URL
        const demoAdminTokenUrl = await getApiUrl('auth', 'demo_admin_token');
        
        // Send request
        const response = await fetch(demoAdminTokenUrl);
        const data = await response.json();
        
        if (response.ok) {
            // Store tokens
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);
            
            // Show success message
            showAlert('Demo admin login successful! Redirecting...', 'success');
            
            // Redirect to admin dashboard after a short delay
            setTimeout(() => {
                window.location.href = '/admin/dashboard';
            }, 1500);
        } else {
            // Show error message
            showAlert(data.message || 'Demo admin login failed', 'danger');
            
            // Reset loading state
            e.target.disabled = false;
            e.target.innerHTML = 'Demo Admin Login';
        }
    } catch (error) {
        console.error('Demo admin login error:', error);
        showAlert('An error occurred during demo admin login', 'danger');
        
        // Reset loading state
        e.target.disabled = false;
        e.target.innerHTML = 'Demo Admin Login';
    }
}

// Show alert message
function showAlert(message, type) {
    const alertContainer = document.getElementById('alert-container');
    if (!alertContainer) return;
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => {
            alertContainer.removeChild(alert);
        }, 150);
    }, 5000);
} 