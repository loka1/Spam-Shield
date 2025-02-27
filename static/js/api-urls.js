// This file manages all API URLs for the application
let apiUrls = null;

// Function to fetch API URLs from the server
async function fetchApiUrls() {
    if (apiUrls) return apiUrls;
    
    try {
        const response = await fetch('/api/urls');
        if (!response.ok) {
            throw new Error('Failed to fetch API URLs');
        }
        
        apiUrls = await response.json();
        return apiUrls;
    } catch (error) {
        console.error('Error fetching API URLs:', error);
        // Fallback to hardcoded URLs if fetch fails
        return {
            auth: {
                register: '/auth/register',
                login: '/auth/login',
                refresh: '/auth/refresh',
                profile: '/auth/profile',
                demo_token: '/auth/demo-token',
            },
            api: {
                check_spam: '/api/check-spam',
                history: '/api/history',
                example_spam: '/api/example/spam',
                example_ham: '/api/example/ham',
            },
            frontend: {
                index: '/ui',
                check: '/check',
                login: '/login',
                register: '/register',
                history: '/history',
            }
        };
    }
}

// Export the function to get API URLs
window.getApiUrl = async function(category, name) {
    const urls = await fetchApiUrls();
    if (urls && urls[category] && urls[category][name]) {
        return urls[category][name];
    }
    console.error(`URL not found: ${category}.${name}`);
    return '/';
}; 