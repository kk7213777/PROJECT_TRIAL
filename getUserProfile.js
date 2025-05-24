//This is server/controller/getUserProfile.js


const UserModel = require("../models/UserModel");

async function getUserProfile(req, res) {
    try {
        const userId = req.user.id; 
        const user = await UserModel.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ message: "User not found", error: true });
        }

        res.status(200).json({ data: user, success: true });
    } catch (err) {
        console.error("Error fetching profile:", err);
        res.status(500).json({ message: err.message || "Internal server error", error: true });
    }
}

module.exports = getUserProfile;
