const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');
const { ObjectId } = require('mongodb'); 
const connectToDatabase = require('./db');
const session = require('express-session'); 

const app = express();
const port = 3000;
// Session middleware configuration
app.use(session({
    secret: '8f95c2b61737b5d0867c5e43f28c7fae1d5be469d6eb5f60b94883b9a9c9f29a', // Use your generated key here
    resave: false, // Don't save session if it wasn't modified
    saveUninitialized: true, // Save new sessions that are not initialized
    cookie: { secure: false } // Set to true if you're using HTTPS
}));


// Multer setup for file uploads (temporary storage for images)
const upload = multer({ dest: 'uploads/' });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes for login and signup pages
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});
// Serve home page for users
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Serve home page for admins
app.get('/home-admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home-admin.html'));
});

// Serve users-admin page
app.get('/users-admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'users-admin.html'));
});



// Handle POST request for sign-up
app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const db = await connectToDatabase();
        const usersCollection = db.collection('users');

        // Check if user already exists
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user into the collection
        await usersCollection.insertOne({ username, email, password: hashedPassword });
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Handle POST request for login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const db = await connectToDatabase();
        const usersCollection = db.collection('users');

        // Check if the user exists in the collection
        let user = await usersCollection.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check if the user is an admin
        if (user.email === 'admin@admin' && await bcrypt.compare(password, user.password)) {
            return res.json({ message: 'Admin login successful', redirectUrl: '/home-admin' });
        }

        // For regular users, compare the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }
        req.session.email = email;
        console.log('Session data:', req.session); // Check if the session is working

        // Redirect to home page for regular users
        res.json({ message: 'Login successful', redirectUrl: '/home' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Handle POST request to add address
app.post('/addAddress', async (req, res) => {
    const { email, username, address, recipient, phoneNumber } = req.body;

    try {
        const db = await connectToDatabase();
        const usersCollection = db.collection('users');
        const addressBookCollection = db.collection('addressbook');

        const user = await usersCollection.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Please provide your login email', success: false });
        }

        await addressBookCollection.insertOne({ email, username, address, recipient, phoneNumber });
        res.json({ message: 'Address saved successfully', success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to save address', success: false });
    }
});


// API endpoint to get users
app.get('/api/users', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const usersCollection = db.collection('users');

        const users = await usersCollection.find({}, { projection: { username: 1, email: 1 } }).toArray();
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// API endpoint to delete a user
app.post('/api/delete-user', async (req, res) => {
    const { email } = req.body;

    try {
        const db = await connectToDatabase();
        const usersCollection = db.collection('users');

        const result = await usersCollection.deleteOne({ email });

        if (result.deletedCount === 1) {
            res.json({ message: 'User deleted successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// API route to add a new candle
app.post('/api/add-candle', upload.single('picture'), async (req, res) => {
    const { name, detail, price } = req.body;
    const picture = req.file;

    try {
        const db = await connectToDatabase();
        const productsCollection = db.collection('products');

        // Move the uploaded file to the public/uploads directory
        const picturePath = `uploads/${picture.filename}`;
        fs.renameSync(picture.path, path.join(__dirname, 'public', picturePath));

        // Insert new candle into the products collection
        await productsCollection.insertOne({
            name,
            detail,
            price: parseFloat(price),
            picture: picturePath // Store image path
        });

        res.json({ success: true, message: 'Candle added successfully' });
    } catch (err) {
        console.error('Error adding candle:', err);
        res.status(500).json({ success: false, message: 'Failed to add candle' });
    }
});



// API route to edit a candle
app.post('/api/edit-candle', upload.single('picture'), async (req, res) => {
    const { id, name, detail, price } = req.body;
    const picture = req.file;

    try {
        const db = await connectToDatabase();
        const productsCollection = db.collection('products');

        const updateData = {
            name,
            detail,
            price: parseFloat(price),
        };

        // If a new picture is uploaded, update the picture path
        if (picture) {
            const picturePath = `uploads/${picture.filename}`;
            fs.renameSync(picture.path, path.join(__dirname, 'public', picturePath)); // Move the uploaded file to public/uploads directory
            updateData.picture = picturePath; // Store the new image path in the database
        }

        // Update the candle in the database using ObjectId conversion
        await productsCollection.updateOne(
            { _id: new ObjectId(id) }, // Convert id to ObjectId
            { $set: updateData }
        );

        res.json({ success: true, message: 'Candle updated successfully' });
    } catch (err) {
        console.error('Error editing candle:', err);
        res.status(500).json({ success: false, message: 'Failed to edit candle' });
    }
});


// API route to delete a candle
app.post('/api/delete-candle', async (req, res) => {
    const { id } = req.body;

    try {
        const db = await connectToDatabase();
        const productsCollection = db.collection('products');

        // Delete the candle using ObjectId conversion
        const result = await productsCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 1) {
            res.json({ success: true, message: 'Candle deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Candle not found' });
        }
    } catch (err) {
        console.error('Error deleting candle:', err);
        res.status(500).json({ success: false, message: 'Failed to delete candle' });
    }
});

// API route to get products
app.get('/api/products', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const productsCollection = db.collection('products');

        const products = await productsCollection.find({}).toArray();
        res.json(products);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// API route to add a product to the cart
app.post('/api/add-to-cart', async (req, res) => {
    const { productId } = req.body;

    // Check if user is logged in by checking the session email
    if (!req.session.email) {
        return res.status(401).json({ success: false, message: 'User not logged in' });
    }

    try {
        const db = await connectToDatabase();
        const productsCollection = db.collection('products');
        const cartCollection = db.collection('cart');

        // Fetch the product details using the productId
        const product = await productsCollection.findOne({ _id: new ObjectId(productId) });

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Insert product details into the cart collection
        await cartCollection.insertOne({
            email: req.session.email,
            productName: product.name,
            productDetail: product.detail,
            productPrice: product.price,
        });

        res.json({ success: true, message: 'Product added to cart' });
    } catch (err) {
        console.error('Error adding product to cart:', err);
        res.status(500).json({ success: false, message: 'Failed to add product to cart' });
    }
});
// Fetch cart items for the logged-in user
app.get('/api/cart-items', async (req, res) => {
    if (!req.session.email) {
        return res.status(401).json({ message: 'User not logged in' });
    }

    try {
        const db = await connectToDatabase();
        const cartCollection = db.collection('cart');

        const cartItems = await cartCollection.find({ email: req.session.email }).toArray();
        res.json(cartItems);
    } catch (err) {
        console.error('Error fetching cart items:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Delete a cart item
app.post('/api/delete-cart-item', async (req, res) => {
    const { id } = req.body;

    try {
        const db = await connectToDatabase();
        const cartCollection = db.collection('cart');

        const result = await cartCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 1) {
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: 'Item not found' });
        }
    } catch (err) {
        console.error('Error deleting cart item:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Place an order
app.post('/api/place-order', async (req, res) => {
    const { name, location, contact, delivery, totalPrice, items } = req.body;

    if (!req.session.email) {
        return res.status(401).json({ message: 'User not logged in' });
    }

    try {
        const db = await connectToDatabase();
        const porderCollection = db.collection('porder');
        const cartCollection = db.collection('cart');

        // Insert order into porder collection
        await porderCollection.insertOne({
            name,
            location,
            contact,
            delivery,
            totalPrice,
            items,
            email: req.session.email,
            date: new Date()  // Optionally add a date for when the order was placed
        });

        // Remove items from the cart
        const itemIds = items.map(item => new ObjectId(item.id));
        await cartCollection.deleteMany({ _id: { $in: itemIds } });

        res.json({ success: true });
    } catch (err) {
        console.error('Error placing order:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// API route to get orders for processing
app.get('/api/get-orders-for-processing', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const porderCollection = db.collection('porder');
        
        const orders = await porderCollection.find({}).toArray();
        res.json(orders);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// API route to delete an order
app.post('/api/delete-order', async (req, res) => {
    const { email, itemName } = req.body;

    try {
        const db = await connectToDatabase();
        const porderCollection = db.collection('porder');

        // Delete the order matching the email and item name
        const result = await porderCollection.deleteMany({
            email,
            'items.name': itemName
        });

        if (result.deletedCount > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: 'Order not found' });
        }
    } catch (err) {
        console.error('Error deleting order:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


app.post('/api/confirm-order', async (req, res) => {
    const { name, email, location } = req.body;

    try {
        const db = await connectToDatabase();
        const Order = db.collection('porder');
        const DeliveryInProgress = db.collection('deliveryinprogress');

        // Find the order in the 'porder' collection
        const order = await Order.findOne({ name, email, location });

        if (order) {
            // Insert the order data into the 'deliveryinprogress' collection
            await DeliveryInProgress.insertOne(order);

            // Delete the original order from 'porder'
            await Order.deleteOne({ name, email, location });

            res.json({ success: true, message: 'Order confirmed and moved to delivery in progress' });
        } else {
            res.status(404).json({ success: false, message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});



// API route to get orders for delivering
app.get('/api/get-orders-for-delivering', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const porderCollection = db.collection('deliveryinprogress');
        
        const orders = await porderCollection.find({}).toArray();
        res.json(orders);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// API route to unsuccessful order
app.post('/api/unsuccessful-order', async (req, res) => {
    const { email, itemName } = req.body;

    try {
        const db = await connectToDatabase();
        const porderCollection = db.collection('deliveryinprogress');

        // Delete the order matching the email and item name
        const result = await porderCollection.deleteMany({
            email,
            'items.name': itemName
        });

        if (result.deletedCount > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: 'Order not found' });
        }
    } catch (err) {
        console.error('Error deleting order:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

//api route for successful-order
app.post('/api/successful-order', async (req, res) => {
    const { name, email, location } = req.body;

    try {
        const db = await connectToDatabase();
        const Order = db.collection('deliveryinprogress');
        const DeliveryInProgress = db.collection('successfullydelivered');

        // Find the order in the 'porder' collection
        const order = await Order.findOne({ name, email, location });

        if (order) {
            // Insert the order data into the 'deliveryinprogress' collection
            await DeliveryInProgress.insertOne(order);

            // Delete the original order from 'porder'
            await Order.deleteOne({ name, email, location });

            res.json({ success: true, message: 'Order confirmed and moved to delivery in progress' });
        } else {
            res.status(404).json({ success: false, message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// API route to get successfully delivered orders
app.get('/api/successfully-delivered-orders', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const successfullyDeliveredCollection = db.collection('successfullydelivered');
        console.log('hello')

        const orders = await successfullyDeliveredCollection.find({}).toArray();
        res.json(orders);
    } catch (err) {
        console.error('Error fetching successfully delivered orders:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});







// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
