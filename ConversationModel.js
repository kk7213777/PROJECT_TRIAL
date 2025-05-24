//This is server/models/conversationModel.js


const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    text: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    videoUrl: { type: String, default: "" },
    seen: { type: Boolean, default: false },
    msgByUserId: { type: mongoose.Schema.ObjectId, required: true, ref: 'User' }
}, { timestamps: true });

const conversationSchema = new mongoose.Schema({
    participants: [
        { type: mongoose.Schema.ObjectId, ref: 'User', required: true }
    ],
    messages: [
        { type: mongoose.Schema.ObjectId, ref: 'Message' }
    ]
}, { timestamps: true });

const MessageModel = mongoose.model('Message', messageSchema);
const ConversationModel = mongoose.model('Conversation', conversationSchema);

module.exports = { MessageModel, ConversationModel };
