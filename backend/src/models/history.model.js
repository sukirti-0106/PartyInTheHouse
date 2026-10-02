import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true
    },
    roomName: {
        type: String,
        required: true
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    videoId: {
        type: String,
        default: ""
    },
    participants: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }],
    startedAt: {
        type: Date,
        default: Date.now
    },
    endedAt: {
        type: Date,
        default: Date.now
    }
});

const History = mongoose.model("History", historySchema);

export default History;