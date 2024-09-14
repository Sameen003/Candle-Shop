document.addEventListener('DOMContentLoaded', async () => {
    const productContainer = document.getElementById('productContainer');

    // Fetch products from the API
    try {
        const response = await fetch('/api/products');
        const products = await response.json();

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('bg-white', 'shadow-lg', 'rounded-lg', 'p-6', 'mb-6', 'text-center', 'border', 'border-gray-200', 'transition', 'transform', 'hover:scale-105');

            productCard.innerHTML = `
                <img src="/${product.picture}" alt="${product.name}" class="w-full h-64 object-cover rounded-lg mb-4">
                <h3 class="text-xl font-extrabold text-gray-800 mb-2">${product.name}</h3>
                <p class="text-gray-600 mb-4">${product.detail}</p>
                <p class="text-lg font-extrabold text-gray-900 mb-6">Tk ${product.price}</p>
                <button class="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition duration-300" onclick="addToCart('${product._id}')">Add to Cart</button>
            `;

            productContainer.appendChild(productCard);
        });
    } catch (error) {
        console.error('Error fetching products:', error);
    }
});

// Add to cart function
async function addToCart(productId) {
    try {
        const response = await fetch('/api/add-to-cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId })
        });

        const result = await response.json();
        if (result.success) {
            alert('Product added to cart successfully');
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Error adding product to cart:', error);
        alert('Failed to add product to cart');
    }
}

// Navigation functions
function logout() {
    window.location.href = 'login.html';
}

function goToProfile() {
    window.location.href = 'profile.html';
}

function goToAddressBook() {
    window.location.href = 'address-book.html';
}

function goToCart() {
    window.location.href = 'cart.html';
}
