async function fetchUsers() {
    try {
        const response = await fetch('/api/users');
        const users = await response.json();
        const tableBody = document.querySelector('#userTable tbody');
        tableBody.innerHTML = ''; // Clear existing rows

        users.forEach(user => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td><button class="delete-button" onclick="deleteUser('${user.email}')">Delete</button></td>
            `;
            
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

async function deleteUser(email) {
    try {
        const response = await fetch('/api/delete-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (response.ok) {
            alert('User deleted successfully');
            fetchUsers(); // Refresh the user list
        } else {
            alert('Failed to delete user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
    }
}

function searchUsers() {
    const searchQuery = document.getElementById('search').value.toLowerCase();
    const rows = document.querySelectorAll('#userTable tbody tr');

    rows.forEach(row => {
        const username = row.children[0].textContent.toLowerCase();
        const email = row.children[1].textContent.toLowerCase();

        // Check if the search query is present in either username or email
        if (username.includes(searchQuery) || email.includes(searchQuery)) {
            row.style.display = ''; // Show matching row
        } else {
            row.style.display = 'none'; // Hide non-matching row
        }
    });
}

// Fetch users when the page loads
fetchUsers();
