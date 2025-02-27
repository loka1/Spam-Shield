document.addEventListener('DOMContentLoaded', async function() {
    // Load dashboard data
    await loadDashboardData();
    
    // Set up refresh interval (every 30 seconds)
    setInterval(loadDashboardData, 30000);
});

async function loadDashboardData() {
    try {
        const statsUrl = await getApiUrl('admin', 'stats');
        const response = await fetch(statsUrl, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch dashboard data');
        }
        
        const data = await response.json();
        
        // Update dashboard cards
        document.getElementById('total-users').textContent = data.total_users;
        document.getElementById('total-requests').textContent = data.total_requests;
        document.getElementById('spam-rate').textContent = `${(data.spam_rate * 100).toFixed(1)}%`;
        
        // Update recent users table
        const recentUsersTable = document.getElementById('recent-users');
        recentUsersTable.innerHTML = '';
        
        data.recent_users.forEach(user => {
            const row = document.createElement('tr');
            const date = new Date(user.created_at);
            
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${date.toLocaleDateString()}</td>
            `;
            
            recentUsersTable.appendChild(row);
        });
        
        // Update recent requests table
        const recentRequestsTable = document.getElementById('recent-requests');
        recentRequestsTable.innerHTML = '';
        
        data.recent_requests.forEach(request => {
            const row = document.createElement('tr');
            const date = new Date(request.timestamp);
            
            row.innerHTML = `
                <td>${request.username || 'Guest'}</td>
                <td class="text-truncate" style="max-width: 150px;">${request.text}</td>
                <td>
                    <span class="badge ${request.is_spam ? 'bg-danger' : 'bg-success'}">
                        ${request.is_spam ? 'Spam' : 'Not Spam'}
                    </span>
                </td>
                <td>${date.toLocaleString()}</td>
            `;
            
            recentRequestsTable.appendChild(row);
        });
        
        // Create API usage chart
        createApiUsageChart(data.api_usage);
        
    } catch (error) {
        console.error('Dashboard data error:', error);
        showAdminAlert('Failed to load dashboard data', 'danger');
    }
}

function createApiUsageChart(apiUsageData) {
    const ctx = document.getElementById('api-usage-chart').getContext('2d');
    
    // Check if chart already exists and destroy it
    if (window.apiUsageChart) {
        window.apiUsageChart.destroy();
    }
    
    // Create new chart
    window.apiUsageChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: apiUsageData.labels,
            datasets: [
                {
                    label: 'API Requests',
                    data: apiUsageData.values,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'API Usage Over Time'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Requests'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                }
            }
        }
    });
} 