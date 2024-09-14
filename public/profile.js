document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentUsername = document.getElementById('currentUsername').value;
    const newUsername = document.getElementById('newUsername').value;
    const newPassword = document.getElementById('newPassword').value;

    try {
        const response = await fetch('/updateProfile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ currentUsername, newUsername, newPassword })
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            window.location.href = '/home';
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Error updating profile');
    }
});
