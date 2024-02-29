const dotenv = require('dotenv');
dotenv.config(); // Load environment variables from .env file

const secretKey = process.env.SECRET_KEY || 'defaultsecretkey';

// Use the secretKey in your application
console.log('Secret Key:', secretKey);

const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')('sk_test_51OpDVgSDmzTNV3wEgtxujZDN5auCOpFMbmhU8G8o6UnCv266ZFuMAhoGCGeGUNjN94HZFuKPYxyduab4mMeIP5MU00OFGo7XCR'); // Replace with your actual Stripe secret key

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Connect to SQLite database
const db = new sqlite3.Database('./database.db');

// Create User Table
db.run(`
    CREATE TABLE IF NOT EXISTS Users (
        userID INTEGER PRIMARY KEY,
        username TEXT NOT NULL,
        email TEXT NOT NULL,
        passwordHash TEXT NOT NULL,
        registrationDate DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// Create Booking Table
db.run(`
    CREATE TABLE IF NOT EXISTS Bookings (
        bookingID INTEGER PRIMARY KEY,
        userID INTEGER,
        reservationDate DATE NOT NULL,
        startTime TIME NOT NULL,
        endTime TIME NOT NULL,
        status TEXT DEFAULT 'Pending',
        FOREIGN KEY (userID) REFERENCES Users(userID)
    )
`);

// Authentication Middleware
const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded; // Make user information available in the request object
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// ... (Other existing middleware and endpoints)

// Sample API endpoint for handling payment
app.post('/api/payment', authenticateUser, async (req, res) => {
    const { amount, currency, paymentMethodId } = req.body;

    // Create a PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: currency,
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
    });

    // Handle payment success or failure
    if (paymentIntent.status === 'succeeded') {
        // Payment successful, update your database or perform other actions
        res.json({ message: 'Payment successful' });
    } else {
        // Payment failed
        res.status(500).json({ error: 'Payment failed' });
    }
});

// ... (Other existing endpoints)
// Sample API endpoint for user registration
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert user into Users table
        db.run(`
            INSERT INTO Users (username, email, passwordHash)
            VALUES (?, ?, ?)
        `, [username, email, passwordHash], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error registering user' });
            }

            // Generate JWT
            const token = jwt.sign({ userId: /* user's ID */, username }, secretKey);

            res.json({ message: 'User registered successfully', token });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error hashing password' });
    }
});

// ... (Other existing endpoints)

// Sample API endpoint for search and reservation
app.post('/api/search-reserve', authenticateUser, (req, res) => {
    const { date, startTime, endTime } = req.body;

    // Implement search and reservation logic here
    // Example: Check availability and create a booking record
    // ...

    res.json({ message: 'Search and reservation successful' });
});

// ... (Other existing endpoints)
// ... (Previous code)

const stripe = require('stripe')('sk_test_51OpDVgSDmzTNV3wEgtxujZDN5auCOpFMbmhU8G8o6UnCv266ZFuMAhoGCGeGUNjN94HZFuKPYxyduab4mMeIP5MU00OFGo7XCR');

// Sample API endpoint for handling payment
app.post('/api/payment', authenticateUser, async (req, res) => {
    const { amount, currency, paymentMethodId } = req.body;

    // Create a PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: currency,
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
    });

    // Handle payment success or failure
    if (paymentIntent.status === 'succeeded') {
        // Payment successful, update your database or perform other actions
        res.json({ message: 'Payment successful' });
    } else {
        // Payment failed
        res.status(500).json({ error: 'Payment failed' });
    }
});

// ... (Other existing endpoints)



// Close the database connection when the server is closed
process.on('SIGINT', () => {
    db.close(() => {
        console.log('Database connection closed.');
        process.exit(0);
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
