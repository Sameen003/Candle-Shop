const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const connectToDatabase = require('./db');
const bcrypt = require('bcryptjs');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Define routes for login and signup pages
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
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
    const { email, password } = req.body; // Use email instead of username

    try {
        const db = await connectToDatabase(); 
        const usersCollection = db.collection('users'); 

        // Check if user exists by email
        const user = await usersCollection.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Compare the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Redirect to home page
        res.json({ message: 'Login successful', redirectUrl: '/home' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Handle POST request to update profile
app.post('/updateProfile', async (req, res) => {
    const { currentEmail, newEmail, newPassword } = req.body;

    try {
        const db = await connectToDatabase(); // Connect to the database
        const usersCollection = db.collection('users'); // Collection name

        // Hash the new password using bcrypt
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's email and hashed password
        const updateResult = await usersCollection.findOneAndUpdate(
            { email: currentEmail },
            { $set: { email: newEmail, password: hashedPassword } },
            { returnOriginal: false }
        );

        if (!updateResult.value) {
            console.error(`User not found: ${currentEmail}`);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log(`Profile updated successfully for user: ${currentEmail}`);
        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        console.error(`Error updating profile: ${err}`);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Handle POST request to add address
app.post('/addAddress', async (req, res) => {
    const { email, username, address, recipient, phoneNumber } = req.body;

    try {
        const db = await connectToDatabase(); 
        const addressBookCollection = db.collection('addressbook'); 

        // Insert new address into the collection
        await addressBookCollection.insertOne({ email, username, address, recipient, phoneNumber });
        res.json({ message: 'Address saved successfully', success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to save address', success: false });
    }
});

// Serve home page
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
