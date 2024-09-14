document.addEventListener('DOMContentLoaded', async () => {
    const cartTableBody = document.getElementById('cartItems');
    const totalPriceElement = document.getElementById('totalPrice');
    const deliverySelect = document.getElementById('delivery');
    const orderForm = document.getElementById('orderForm');

    // Fetch cart items from the server
    try {
        const response = await fetch('/api/cart-items');
        const cartItems = await response.json();

        if (cartItems.length === 0) {
            cartTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">Your cart is empty.</td></tr>';
        } else {
            cartItems.forEach(item => {
                const row = document.createElement('tr');
                row.classList.add('border-b', 'border-gray-200');
                row.innerHTML = `
                    <td class="py-4 px-6 text-gray-800">${item.productName}</td>
                    <td class="py-4 px-6 text-gray-600">${item.productDetail}</td>
                    <td class="py-4 px-6 text-gray-900">Tk ${item.productPrice.toFixed(2)}</td>
                    <td class="py-4 px-6 text-center">
                        <input type="checkbox" class="selectItem form-checkbox h-5 w-5 text-blue-600" data-id="${item._id}" data-price="${item.productPrice}" data-name="${item.productName}" data-detail="${item.productDetail}">
                    </td>
                    <td class="py-4 px-6 text-center">
                        <button class="deleteItem text-red-600 hover:text-red-800 font-semibold" data-id="${item._id}">Delete</button>
                    </td>
                `;
                cartTableBody.appendChild(row);
            });
            updateTotalPrice();
        }
    } catch (error) {
        console.error('Error fetching cart items:', error);
    }

    // Handle delete button clicks
    cartTableBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('deleteItem')) {
            const itemId = event.target.getAttribute('data-id');

            try {
                const response = await fetch('/api/delete-cart-item', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: itemId })
                });
                const result = await response.json();

                if (result.success) {
                    event.target.closest('tr').remove();
                    updateTotalPrice();
                } else {
                    alert('Failed to delete item');
                }
            } catch (error) {
                console.error('Error deleting cart item:', error);
            }
        }
    });

    // Handle item selection change
    cartTableBody.addEventListener('change', (event) => {
        if (event.target.classList.contains('selectItem')) {
            updateTotalPrice();
        }
    });

    // Handle delivery option change
    deliverySelect.addEventListener('change', () => {
        updateTotalPrice();
    });

    // Handle form submission
    orderForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const name = document.getElementById('name').value;
        const location = document.getElementById('location').value;
        const contact = document.getElementById('contact').value;
        const delivery = document.getElementById('delivery').value;

        const selectedItems = Array.from(document.querySelectorAll('.selectItem:checked')).map(item => ({
            id: item.getAttribute('data-id'),
            price: parseFloat(item.getAttribute('data-price')),
            name: item.getAttribute('data-name'),
            detail: item.getAttribute('data-detail')
        }));

        if (selectedItems.length === 0) {
            alert('Please select at least one item');
            return;
        }

        const totalPrice = calculateTotalPrice(selectedItems, delivery);

        try {
            const response = await fetch('/api/place-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    location,
                    contact,
                    delivery,
                    totalPrice,
                    items: selectedItems
                })
            });
            const result = await response.json();

            if (result.success) {
                alert('Order placed successfully');
                // Optionally, redirect or clear the cart
            } else {
                alert('Failed to place order');
            }
        } catch (error) {
            console.error('Error placing order:', error);
        }
    });

    function updateTotalPrice() {
        const selectedItems = Array.from(document.querySelectorAll('.selectItem:checked'));
        const totalPriceWithoutDelivery = selectedItems.reduce((total, item) => total + parseFloat(item.getAttribute('data-price')), 0);
        const deliveryFee = deliverySelect.value === 'inside' ? 70 : 130;
        const totalPrice = totalPriceWithoutDelivery + deliveryFee;
        totalPriceElement.textContent = `Tk ${totalPrice.toFixed(2)}`;
    }

    function calculateTotalPrice(items, delivery) {
        let total = items.reduce((sum, item) => sum + item.price, 0);
        const deliveryFee = delivery === 'inside' ? 70 : 130;
        return total + deliveryFee;
    }
});
