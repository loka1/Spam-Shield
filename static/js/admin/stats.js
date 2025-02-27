document.addEventListener('DOMContentLoaded', async function() {
    // Load statistics data
    await loadStatistics();
    
    // Set up refresh button
    document.getElementById('refresh-patterns-btn').addEventListener('click', loadStatistics);
    
    // Set up refresh interval (every 5 minutes)
    setInterval(loadStatistics, 300000);
});

async function loadStatistics() {
    try {
        const detailedStatsUrl = await getApiUrl('admin', 'detailed_stats');
        const response = await fetch(detailedStatsUrl, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch statistics');
        }
        
        const data = await response.json();
        
        // Create charts
        createSpamDistributionChart(data.spam_distribution);
        createUserRegistrationChart(data.user_registration);
        createConfidenceDistributionChart(data.confidence_distribution);
        
        // Update top patterns table
        updateTopPatternsTable(data.top_patterns);
        
    } catch (error) {
        console.error('Statistics error:', error);
        showAdminAlert('Failed to load statistics data', 'danger');
    }
}

function createSpamDistributionChart(data) {
    const ctx = document.getElementById('spam-distribution-chart').getContext('2d');
    
    // Check if chart already exists and destroy it
    if (window.spamDistributionChart) {
        window.spamDistributionChart.destroy();
    }
    
    // Create new chart
    window.spamDistributionChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(75, 192, 192, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Spam vs. Ham Distribution'
                }
            }
        }
    });
}

function createUserRegistrationChart(data) {
    const ctx = document.getElementById('user-registration-chart').getContext('2d');
    
    // Check if chart already exists and destroy it
    if (window.userRegistrationChart) {
        window.userRegistrationChart.destroy();
    }
    
    // Create new chart
    window.userRegistrationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'New Users',
                data: data.values,
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'User Registration Over Time'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Users'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Month'
                    }
                }
            }
        }
    });
}

function createConfidenceDistributionChart(data) {
    const ctx = document.getElementById('confidence-distribution-chart').getContext('2d');
    
    // Check if chart already exists and destroy it
    if (window.confidenceDistributionChart) {
        window.confidenceDistributionChart.destroy();
    }
    
    // Create new chart
    window.confidenceDistributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Number of Requests',
                data: data.values,
                backgroundColor: 'rgba(153, 102, 255, 0.7)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Confidence Distribution'
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
                        text: 'Confidence Range'
                    }
                }
            }
        }
    });
}

function updateTopPatternsTable(patterns) {
    const patternsTableBody = document.getElementById('patterns-table-body');
    patternsTableBody.innerHTML = '';
    
    if (patterns.length === 0) {
        patternsTableBody.innerHTML = '<tr><td colspan="3" class="text-center">No patterns found</td></tr>';
        return;
    }
    
    patterns.forEach(pattern => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${pattern.pattern}</td>
            <td>${pattern.occurrences}</td>
            <td>${(pattern.avg_confidence * 100).toFixed(1)}%</td>
        `;
        
        patternsTableBody.appendChild(row);
    });
} 