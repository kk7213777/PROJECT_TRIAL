const mongoose = require('mongoose');
require('dotenv').config();

async function testMongoConnection() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connection successful");
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
}

testMongoConnection();
