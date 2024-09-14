document.getElementById('addCandleForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const formData = new FormData();
    formData.append('name', document.getElementById('candleName').value);
    formData.append('detail', document.getElementById('candleDetail').value);
    formData.append('price', document.getElementById('candlePrice').value);
    formData.append('picture', document.getElementById('candlePicture').files[0]);

    try {
        const response = await fetch('/api/add-candle', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        const messageElement = document.getElementById('message');
        if (result.success) {
            messageElement.textContent = 'Candle added successfully!';
        } else {
            messageElement.textContent = 'Failed to add candle: ' + result.message;
        }
        messageElement.style.display = 'block';
    } catch (error) {
        console.error('Error adding candle:', error);
        document.getElementById('message').textContent = 'An error occurred while adding the candle.';
        document.getElementById('message').style.display = 'block';
    }
});
