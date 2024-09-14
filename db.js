const { MongoClient } = require('mongodb');

async function connectToDatabase() {
    const uri = 'mongodb+srv://Sameen003:00destruct0@cluster0.ddbvsem.mongodb.net/';
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        console.log("Connected to MongoDB");
        return client.db('candleshop'); // Updated database name
    } catch (err) {
        console.error(err);
        process.exit(1); // Exit process with failure
    }
}

module.exports = connectToDatabase;
