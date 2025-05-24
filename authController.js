//This is server/controller/authcontroller.js


const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');
const jwtSecretKey = process.env.JWT_SECRET_KEY;

function generateToken(userData) {
    return jwt.sign(userData, jwtSecretKey, { expiresIn: '1h' });
}

async function registerUser(req, res) {
    const { name, email, password, profile_pic = "" } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, and password are required.", error: true });
    }

    try {
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists.", error: true });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new UserModel({
            name,
            email,
            password: hashedPassword,
            profile_pic,
        });
        await newUser.save();

        return res.status(201).json({ message: "User created successfully.", success: true });
    } catch (err) {
        return res.status(500).json({ message: "Server error", error: true });
    }
}

async function loginUser(req, res) {
    let { email, password } = req.body;

    email = email?.trim();
    password = password?.trim();

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required.", error: true });
    }

    try {
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found.", error: true });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password.", error: true });
        }

        const token = generateToken({ id: user._id, email: user.email });

        return res
            .cookie('token', token, { httpOnly: true, sameSite: 'Strict', secure: false })
            .status(200)
            .json({ message: "Login successful.", success: true, token });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: true });
    }
}

function logoutUser(req, res) {
    return res
        .cookie('token', '', { httpOnly: true, expires: new Date(0) })
        .status(200)
        .json({ message: "Session ended successfully", success: true });
}

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
};
