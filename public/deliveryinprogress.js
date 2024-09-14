document.addEventListener('DOMContentLoaded', function() {
    fetchOrders();

    // Function to fetch orders and populate the table
    async function fetchOrders() {
        try {
            const response = await fetch('/api/get-orders-for-delivering');
            const orders = await response.json();
            const tableBody = document.querySelector('#ordersTable tbody');

            tableBody.innerHTML = '';

            orders.forEach(order => {
                const row = document.createElement('tr');

                // Construct items details
                const itemsDetails = order.items.map(item => 
                    `${item.name} (${item.detail}) - $${item.price}`
                ).join('<br>');

                row.innerHTML = `
                    <td>${order.name}</td>
                    <td>${order.contact}</td>
                    <td>${order.delivery}</td>
                    <td>${order.location}</td>
                    <td>${order.email}</td>
                    <td>$${order.totalPrice.toFixed(2)}</td>
                    <td>${itemsDetails}</td>
                    <td>
                        <button class="delete" onclick="unsuccessfulOrder('${order.email}', '${order.items[0].name}')">Unsuccessful Delivery</button>
                         <button class="confirm" onclick="confirmDelivery('${order.name}', '${order.email}', '${order.location}')">Delivered</button>
                        
                    </td>
                `;

                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    }

    // Function to delete an order
    window.unsuccessfulOrder = async function(email, itemName) {
        try {
            const response = await fetch('/api/unsuccessful-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, itemName }),
            });
            const result = await response.json();

            if (result.success) {
                fetchOrders(); // Refresh the orders list
            } else {
                console.error('Error deleting order:', result.message);
            }
        } catch (error) {
            console.error('Error deleting order:', error);
        }
    };

    // Function to confirm an order
    window.confirmDelivery = async function(name, email, location) {
        try {
            const response = await fetch('/api/successful-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, location }),
            });
            const result = await response.json();
    
            if (result.success) {
                fetchOrders(); // Refresh the orders list
            } else {
                console.error('Error confirming order:', result.message);
            }
        } catch (error) {
            console.error('Error confirming order:', error);
        }
    };
    
    
});
