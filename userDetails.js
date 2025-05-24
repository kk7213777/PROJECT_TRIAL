//This is server/controller/userDetails.js


const UserModel = require('../models/UserModel');

const userDetails = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await UserModel.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found", 
                error: true 
            });
        }
//12
        return res.status(200).json({ 
            success: true, 
            user 
        });
    } catch (error) {
        console.error('Error fetching user details:', error);

        return res.status(500).json({ 
            success: false, 
            message: "Failed to fetch user profile. Please try again later.", 
            error: true 
        });
    }
};

module.exports = userDetails;
