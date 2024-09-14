document.addEventListener('DOMContentLoaded', function() {
    fetchOrders();

    // Function to fetch orders and populate the table
    async function fetchOrders() {
        try {
            const response = await fetch('/api/get-orders-for-processing');
            const orders = await response.json();
            const tableBody = document.querySelector('#ordersTable tbody');

            tableBody.innerHTML = '';

            orders.forEach(order => {
                const row = document.createElement('tr');
                row.classList.add('border-b', 'border-gray-200', 'text-gray-800');

                // Construct items details
                const itemsDetails = order.items.map(item => 
                    `${item.name} (${item.detail}) - Tk ${item.price.toFixed(2)}`
                ).join('<br>');

                row.innerHTML = `
                    <td class="py-4 px-6">${order.name}</td>
                    <td class="py-4 px-6">${order.contact}</td>
                    <td class="py-4 px-6">${order.delivery}</td>
                    <td class="py-4 px-6">${order.location}</td>
                    <td class="py-4 px-6">${order.email}</td>
                    <td class="py-4 px-6 font-semibold text-gray-900">Tk ${order.totalPrice.toFixed(2)}</td>
                    <td class="py-4 px-6">${itemsDetails}</td>
                    <td class="py-4 px-6 text-center">
                        <button class="delete bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded" onclick="deleteOrder('${order.email}', '${order.items[0].name}')">Delete Order</button>
                        <button class="confirm bg-green-500 text-white hover:bg-green-600 px-4 py-2 rounded mt-2" onclick="confirmOrder('${order.name}', '${order.email}', '${order.location}')">Confirm Order</button>
                    </td>
                `;

                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    }

    // Function to delete an order
    window.deleteOrder = async function(email, itemName) {
        try {
            const response = await fetch('/api/delete-order', {
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
    window.confirmOrder = async function(name, email, location) {
        try {
            const response = await fetch('/api/confirm-order', {
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
