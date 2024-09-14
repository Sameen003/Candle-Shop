document.addEventListener('DOMContentLoaded', async () => {
    const candleSelect = document.getElementById('candleSelect');
    const deleteButton = document.getElementById('deleteButton');

    // Fetch all candles from the API
    const candles = await fetch('/api/products').then(res => res.json());

    // Populate the dropdown with candle options
    candles.forEach(candle => {
        const option = document.createElement('option');
        option.value = candle._id;
        option.text = candle.name;
        candleSelect.add(option);
    });

    // Handle selection change to populate form fields
    candleSelect.addEventListener('change', () => {
        const selectedCandle = candles.find(candle => candle._id === candleSelect.value);
        document.getElementById('name').value = selectedCandle.name;
        document.getElementById('detail').value = selectedCandle.detail;
        document.getElementById('price').value = selectedCandle.price;
    });

    // Handle form submission for updating the candle
    document.getElementById('editCandleForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(event.target);
        formData.append('id', candleSelect.value); // Add the selected candle ID

        const response = await fetch('/api/edit-candle', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        alert(result.message);
    });

    // Handle deleting the selected candle
    deleteButton.addEventListener('click', async () => {
        const candleId = candleSelect.value;
        const response = await fetch('/api/delete-candle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: candleId })
        });

        const result = await response.json();
        alert(result.message);

        if (result.success) {
            location.reload(); // Reload page after deletion
        }
    });
});
