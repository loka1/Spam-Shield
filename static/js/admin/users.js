document.addEventListener('DOMContentLoaded', async function() {
    // Load users data
    await loadUsers();
    
    // Set up event listeners
    document.getElementById('add-user-form').addEventListener('submit', handleAddUser);
    document.getElementById('edit-user-form').addEventListener('submit', handleEditUser);
    document.getElementById('prev-page').addEventListener('click', () => changePage(-1));
    document.getElementById('next-page').addEventListener('click', () => changePage(1));
    
    // Set up delete user event listeners (will be added dynamically)
});

// Global variables
let currentPage = 1;
let totalPages = 1;
let usersPerPage = 10;

async function loadUsers(page = 1) {
    try {
        const usersUrl = await getApiUrl('admin', 'users');
        const response = await fetch(`${usersUrl}?page=${page}&per_page=${usersPerPage}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        
        // Update pagination info
        currentPage = data.page;
        totalPages = data.pages;
        
        // Update pagination display
        document.getElementById('showing-start').textContent = (currentPage - 1) * usersPerPage + 1;
        document.getElementById('showing-end').textContent = Math.min(currentPage * usersPerPage, data.total);
        document.getElementById('total-count').textContent = data.total;
        
        // Enable/disable pagination buttons
        document.getElementById('prev-page').disabled = currentPage <= 1;
        document.getElementById('next-page').disabled = currentPage >= totalPages;
        
        // Update users table
        const usersTableBody = document.getElementById('users-table-body');
        usersTableBody.innerHTML = '';
        
        data.users.forEach(user => {
            const row = document.createElement('tr');
            const date = new Date(user.created_at);
            
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${date.toLocaleDateString()}</td>
                <td>
                    <span class="badge ${user.is_admin ? 'bg-danger' : 'bg-secondary'}">
                        ${user.is_admin ? 'Yes' : 'No'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary edit-user-btn" data-user-id="${user.id}">Edit</button>
                    <button class="btn btn-sm btn-outline-danger delete-user-btn" data-user-id="${user.id}">Delete</button>
                </td>
            `;
            
            usersTableBody.appendChild(row);
        });
        
        // Add event listeners to edit and delete buttons
        document.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditUserModal(btn.getAttribute('data-user-id')));
        });
        
        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', () => confirmDeleteUser(btn.getAttribute('data-user-id')));
        });
        
    } catch (error) {
        console.error('Users data error:', error);
        showAdminAlert('Failed to load users data', 'danger');
    }
}

async function handleAddUser(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const isAdmin = document.getElementById('is-admin').checked;
    
    try {
        const usersUrl = await getApiUrl('admin', 'users');
        const response = await fetch(usersUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify({
                username,
                email,
                password,
                is_admin: isAdmin
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAdminAlert('User added successfully', 'success');
            
            // Close modal and reset form
            const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
            modal.hide();
            document.getElementById('add-user-form').reset();
            
            // Reload users
            await loadUsers(currentPage);
        } else {
            showAdminAlert(data.message || 'Failed to add user', 'danger');
        }
    } catch (error) {
        console.error('Add user error:', error);
        showAdminAlert('An error occurred while adding the user', 'danger');
    }
}

async function openEditUserModal(userId) {
    try {
        const usersUrl = await getApiUrl('admin', 'users');
        const response = await fetch(`${usersUrl}/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch user details');
        }
        
        const user = await response.json();
        
        // Populate form
        document.getElementById('edit-user-id').value = user.id;
        document.getElementById('edit-username').value = user.username;
        document.getElementById('edit-email').value = user.email;
        document.getElementById('edit-password').value = '';
        document.getElementById('edit-is-admin').checked = user.is_admin;
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
        modal.show();
    } catch (error) {
        console.error('Edit user error:', error);
        showAdminAlert('Failed to load user details', 'danger');
    }
}

async function handleEditUser(e) {
    e.preventDefault();
    
    const userId = document.getElementById('edit-user-id').value;
    const username = document.getElementById('edit-username').value;
    const email = document.getElementById('edit-email').value;
    const password = document.getElementById('edit-password').value;
    const isAdmin = document.getElementById('edit-is-admin').checked;
    
    try {
        const usersUrl = await getApiUrl('admin', 'users');
        const response = await fetch(`${usersUrl}/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify({
                username,
                email,
                password,
                is_admin: isAdmin
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAdminAlert('User updated successfully', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
            modal.hide();
            
            // Reload users
            await loadUsers(currentPage);
        } else {
            showAdminAlert(data.message || 'Failed to update user', 'danger');
        }
    } catch (error) {
        console.error('Update user error:', error);
        showAdminAlert('An error occurred while updating the user', 'danger');
    }
}

async function confirmDeleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        try {
            const usersUrl = await getApiUrl('admin', 'users');
            const response = await fetch(`${usersUrl}/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showAdminAlert('User deleted successfully', 'success');
                
                // Reload users
                await loadUsers(currentPage);
            } else {
                showAdminAlert(data.message || 'Failed to delete user', 'danger');
            }
        } catch (error) {
            console.error('Delete user error:', error);
            showAdminAlert('An error occurred while deleting the user', 'danger');
        }
    }
}

function changePage(direction) {
    const newPage = currentPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        loadUsers(newPage);
    }
} 