document.addEventListener('DOMContentLoaded', async function() {
    // Load requests data
    await loadRequests();
    
    // Load users for filter dropdown
    await loadUsersForFilter();
    
    // Set up event listeners
    document.getElementById('refresh-btn').addEventListener('click', () => loadRequests(currentPage));
    document.getElementById('export-csv-btn').addEventListener('click', exportRequestsCSV);
    document.getElementById('apply-filters-btn').addEventListener('click', applyFilters);
    document.getElementById('clear-filters-btn').addEventListener('click', clearFilters);
    document.getElementById('prev-page').addEventListener('click', () => changePage(-1));
    document.getElementById('next-page').addEventListener('click', () => changePage(1));
});

// Global variables
let currentPage = 1;
let totalPages = 1;
let requestsPerPage = 10;
let currentFilters = {};

async function loadRequests(page = 1) {
    try {
        // Show loading state
        const requestsTableBody = document.getElementById('requests-table-body');
        requestsTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>';
        
        // Build URL with filters
        const requestsUrl = await getApiUrl('admin', 'requests');
        let url = `${requestsUrl}?page=${page}&per_page=${requestsPerPage}`;
        
        // Add filters to URL
        for (const [key, value] of Object.entries(currentFilters)) {
            if (value) {
                url += `&${key}=${encodeURIComponent(value)}`;
            }
        }
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch requests');
        }
        
        const data = await response.json();
        
        // Update pagination info
        currentPage = data.page;
        totalPages = data.pages;
        
        // Update pagination display
        document.getElementById('showing-start').textContent = data.total > 0 
            ? (currentPage - 1) * requestsPerPage + 1 
            : 0;
        document.getElementById('showing-end').textContent = Math.min(currentPage * requestsPerPage, data.total);
        document.getElementById('total-count').textContent = data.total;
        
        // Enable/disable pagination buttons
        document.getElementById('prev-page').disabled = currentPage <= 1;
        document.getElementById('next-page').disabled = currentPage >= totalPages;
        
        // Update requests table
        requestsTableBody.innerHTML = '';
        
        if (data.requests.length === 0) {
            requestsTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No requests found</td></tr>';
            return;
        }
        
        data.requests.forEach(request => {
            const row = document.createElement('tr');
            const date = new Date(request.timestamp);
            
            // Truncate text if too long
            let displayText = request.text;
            if (displayText.length > 50) {
                displayText = displayText.substring(0, 47) + '...';
            }
            
            row.innerHTML = `
                <td>${request.id}</td>
                <td>${request.username || 'Guest'}</td>
                <td class="text-truncate" title="${request.text}">${displayText}</td>
                <td>
                    <span class="badge ${request.is_spam ? 'bg-danger' : 'bg-success'}">
                        ${request.is_spam ? 'Spam' : 'Not Spam'}
                    </span>
                </td>
                <td>${(request.confidence * 100).toFixed(1)}%</td>
                <td>${date.toLocaleString()}</td>
            `;
            
            requestsTableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Requests data error:', error);
        showAdminAlert('Failed to load requests data', 'danger');
    }
}

async function loadUsersForFilter() {
    try {
        const usersListUrl = await getApiUrl('admin', 'users_list');
        const response = await fetch(usersListUrl, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch users list');
        }
        
        const users = await response.json();
        
        // Update user filter dropdown
        const filterUser = document.getElementById('filter-user');
        
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.username;
            filterUser.appendChild(option);
        });
        
    } catch (error) {
        console.error('Users list error:', error);
        showAdminAlert('Failed to load users for filter', 'warning');
    }
}

function applyFilters() {
    // Get filter values
    const userId = document.getElementById('filter-user').value;
    const result = document.getElementById('filter-result').value;
    const dateFrom = document.getElementById('filter-date-from').value;
    const dateTo = document.getElementById('filter-date-to').value;
    
    // Update current filters
    currentFilters = {
        user_id: userId,
        result: result,
        date_from: dateFrom,
        date_to: dateTo
    };
    
    // Reload requests with page 1
    loadRequests(1);
}

function clearFilters() {
    // Reset filter inputs
    document.getElementById('filter-user').value = '';
    document.getElementById('filter-result').value = '';
    document.getElementById('filter-date-from').value = '';
    document.getElementById('filter-date-to').value = '';
    
    // Clear current filters
    currentFilters = {};
    
    // Reload requests
    loadRequests(1);
}

async function exportRequestsCSV() {
    try {
        const exportUrl = await getApiUrl('admin', 'export_requests');
        
        // Create a temporary link and click it to download the file
        const link = document.createElement('a');
        link.href = exportUrl + '?token=' + localStorage.getItem('access_token');
        link.download = 'requests.csv';
        link.click();
        
    } catch (error) {
        console.error('Export error:', error);
        showAdminAlert('Failed to export requests', 'danger');
    }
}

function changePage(direction) {
    const newPage = currentPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        loadRequests(newPage);
    }
} 