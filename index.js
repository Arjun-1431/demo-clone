const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const app = express()
const registerModel = require('./Models/RegisterModel')

const corsOptions = {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'],
    credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
mongoose.connect('mongodb+srv://anujsingh32085:123@cluster1.jead8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1')
    .then(() => console.log('MongoDB Atlas Connected'))
    .catch(err => console.error('MongoDB connection error:', err));




app.post('/register', async (req, res) => {
    try {
        const { name, email, password, mobile, isAdmin, role } = req.body;

        // Check if user with the provided email already exists
        const existingUser = await registerModel.findOne({ email });
        if (existingUser) {
            // If user already exists, send a response indicating the conflict
            return res.status(409).json({ error: 'User with this email already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate a unique personId using uuid
        const personId = uuidv4();

        // Create a new user instance with the hashed password
        const newUser = new registerModel({
            name,
            email,
            password: hashedPassword,
            // Corrected the field name to 'contact'
            mobile,
            role,
            isAdmin,
            personId,
        });

        // Save the new user to the database
        await newUser.save();

        // Send success response
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        // Send error response
        console.error('Error during user registration:', error);
        res.status(400).json({ error: error.message });
    }
});



app.post("/login/api/check", async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("Received login request for email:", email);

        // Find user by username
        const user = await registerModel.findOne({ email });

        console.log("Found user:", user);

        if (!user) {
            console.log("User not found.");
            return res.status(401).json({ message: 'Authentication failed. User not found.' });
        }

        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, user.password);

        console.log("Password validity:", isPasswordValid);

        if (!isPasswordValid) {
            console.log("Incorrect password.");
            return res.status(401).json({ message: 'Authentication failed. Incorrect password.' });
        }

        // Determine user type based on isAdmin and role fields
        let greetingMessage = '';
        if (user.isAdmin) {
            greetingMessage = `Hello admin. User logged in successfully`;
        } else if (user.role === 'employee') {
            greetingMessage = `Hello employee. employee logged in successfully`;
        } else {
            greetingMessage = `Hello teamLead. teamLead logged in successfully`;
        }

        console.log("Greeting message:", greetingMessage);

        // Retrieve all information about the logged-in user
        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            // Include other fields as needed
        };

        console.log("User data:", userData);

        // If authentication succeeds, return the user profile along with the greeting message
        res.status(200).json({ message: greetingMessage, user: userData });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(5000, () => {
    console.log("Server is running on Port 5000")
})