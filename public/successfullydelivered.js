document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/successfully-delivered-orders')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('ordersTableBody');
            tableBody.innerHTML = data.map(order => `
                <tr>
                    <td>${order.name}</td>
                    <td>${order.email}</td>
                    <td>${order.contact}</td>
                    <td>${order.location}</td>
                    <td>${order.totalPrice}</td>
                    <td>${new Date(order.date).toLocaleDateString()}</td>
                </tr>
            `).join('');
        })
        .catch(error => {
            console.error('Error fetching orders:', error);
        });
});
