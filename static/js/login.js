document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const demoLoginBtn = document.getElementById('demo-login-btn');
    const demoAdminLoginBtn = document.getElementById('demo-admin-login-btn');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (demoLoginBtn) {
        demoLoginBtn.addEventListener('click', handleDemoLogin);
    }
    
    if (demoAdminLoginBtn) {
        demoAdminLoginBtn.addEventListener('click', handleDemoAdminLogin);
    }
    
    // Redirect if already logged in
    if (localStorage.getItem('access_token')) {
        window.location.href = '/';
    }
});

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Validate inputs
    if (!username || !password) {
        showAlert('Please fill in all fields', 'danger');
        return;
    }
    
    try {
        // Get login URL
        const loginUrl = await getApiUrl('auth', 'login');
        
        // Send login request
        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store tokens
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirect to root, which will redirect to index
            window.location.href = '/';
        } else {
            showAlert(data.message || 'Login failed', 'danger');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('An error occurred during login', 'danger');
    }
}

async function handleDemoLogin() {
    try {
        // Get demo token URL
        const demoTokenUrl = await getApiUrl('auth', 'demo_token');
        
        // Get demo token
        const response = await fetch(demoTokenUrl);
        const data = await response.json();
        
        if (response.ok) {
            // Store tokens
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirect to root, which will redirect to index
            window.location.href = '/';
        } else {
            showAlert(data.message || 'Demo login failed', 'danger');
        }
    } catch (error) {
        console.error('Demo login error:', error);
        showAlert('An error occurred during demo login', 'danger');
    }
}

async function handleDemoAdminLogin() {
    try {
        const demoAdminTokenUrl = await getApiUrl('auth', 'demo_admin_token');
        const response = await fetch(demoAdminTokenUrl);
        
        const data = await response.json();
        
        if (response.ok) {
            // Store tokens
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirect to admin dashboard
            window.location.href = '/admin/dashboard';
        } else {
            showAlert(data.message || 'Demo admin login failed', 'danger');
        }
    } catch (error) {
        console.error('Demo admin login error:', error);
        showAlert('An error occurred during demo admin login', 'danger');
    }
} 