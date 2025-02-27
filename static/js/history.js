document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    
    // Load history
    loadHistory();
    
    // Refresh button event listener
    const refreshBtn = document.getElementById('refresh-history');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadHistory);
    }
});

async function loadHistory() {
    const token = localStorage.getItem('access_token');
    const loadingElement = document.getElementById('history-loading');
    const emptyElement = document.getElementById('history-empty');
    const tableContainer = document.getElementById('history-table-container');
    const tableBody = document.getElementById('history-table-body');
    
    // Show loading
    if (loadingElement) loadingElement.style.display = 'block';
    if (emptyElement) emptyElement.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'none';
    
    try {
        // Get history URL
        const historyUrl = await getApiUrl('api', 'history');
        
        // Fetch history
        const response = await fetch(historyUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch history');
        }
        
        const data = await response.json();
        
        // Hide loading
        if (loadingElement) loadingElement.style.display = 'none';
        
        // Check if history is empty
        if (!data.history || data.history.length === 0) {
            if (emptyElement) emptyElement.style.display = 'block';
            return;
        }
        
        // Show table and populate with data
        if (tableContainer) tableContainer.style.display = 'block';
        if (tableBody) {
            tableBody.innerHTML = '';
            
            data.history.forEach(item => {
                const row = document.createElement('tr');
                
                // Format date
                const date = new Date(item.timestamp);
                const formattedDate = date.toLocaleString();
                
                // Create cells
                row.innerHTML = `
                    <td>${formattedDate}</td>
                    <td class="text-truncate-container"><p>${item.text}</p></td>
                    <td>
                        <span class="badge ${item.is_spam ? 'bg-danger' : 'bg-success'}">
                            ${item.is_spam ? 'Spam' : 'Not Spam'}
                        </span>
                    </td>
                    <td>${(item.confidence * 100).toFixed(2)}%</td>
                `;
                
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('History error:', error);
        showAlert('Failed to load history. Please try again later.', 'danger');
        
        // Hide loading, show empty
        if (loadingElement) loadingElement.style.display = 'none';
        if (emptyElement) emptyElement.style.display = 'block';
        if (tableContainer) tableContainer.style.display = 'none';
    }
} 