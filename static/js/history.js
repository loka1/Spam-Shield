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
    const tableContainer = document.getElementById('history-table');
    const tableBody = document.getElementById('history-table-body');
    const refreshBtn = document.getElementById('refresh-history');
    
    try {
        // Show loading state
        showLoadingState();
        
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
        
        // Handle empty history
        if (!data.history || data.history.length === 0) {
            showEmptyState();
            return;
        }
        
        // Show table and populate with data
        showTableState();
        populateTable(data.history);
        
    } catch (error) {
        console.error('History error:', error);
        showAlert('Failed to load history. Please try again later.', 'danger');
        showEmptyState();
    } finally {
        // Re-enable refresh button
        if (refreshBtn) {
            refreshBtn.disabled = false;
        }
    }
}

// Helper functions to manage UI states
function showLoadingState() {
    const loadingElement = document.getElementById('history-loading');
    const emptyElement = document.getElementById('history-empty');
    const tableContainer = document.getElementById('history-table');
    const refreshBtn = document.getElementById('refresh-history');
    
    if (loadingElement) loadingElement.style.display = 'block';
    if (emptyElement) emptyElement.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'none';
    if (refreshBtn) refreshBtn.disabled = true;
}

function showEmptyState() {
    const loadingElement = document.getElementById('history-loading');
    const emptyElement = document.getElementById('history-empty');
    const tableContainer = document.getElementById('history-table');
    
    if (loadingElement) loadingElement.style.display = 'none';
    if (emptyElement) emptyElement.style.display = 'block';
    if (tableContainer) tableContainer.style.display = 'none';
}

function showTableState() {
    const loadingElement = document.getElementById('history-loading');
    const emptyElement = document.getElementById('history-empty');
    const tableContainer = document.getElementById('history-table');
    
    if (loadingElement) loadingElement.style.display = 'none';
    if (emptyElement) emptyElement.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'table';
}

function populateTable(history) {
    const tableBody = document.getElementById('history-table-body');
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Add new rows
    history.forEach(item => {
        const row = createHistoryRow(item);
        tableBody.appendChild(row);
    });
}

function createHistoryRow(item) {
    const row = document.createElement('tr');
    
    const date = new Date(item.timestamp).toLocaleString();
    const truncatedText = item.text.length > 100 ? item.text.slice(0, 100) + '...' : item.text;
    const confidencePercent = Math.round(item.confidence * 100);
    
    row.innerHTML = `
        <td class="text-muted" style="white-space: nowrap;">${date}</td>
        <td class="text-truncate" style="max-width: 300px;">${truncatedText}</td>
        <td>
            <span class="history-result ${item.is_spam ? 'spam' : 'legitimate'}">
                ${item.is_spam ? 
                    '<i class="bi bi-exclamation-triangle-fill"></i> Spam' : 
                    '<i class="bi bi-check-circle-fill"></i> Legitimate'}
            </span>
        </td>
        <td>
            <span class="confidence-badge">
                ${confidencePercent}%
            </span>
        </td>
    `;
    
    return row;
} 