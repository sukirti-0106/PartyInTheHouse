import crypto from "crypto";
import Room from "../models/room.model.js";
import History from "../models/history.model.js";

const generateRoomId = () => {
    return crypto.randomBytes(4).toString("hex");
};

export const createRoom = async (req, res) => {
    try {
        const { name, videoId } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Room name is required"
            });
        }

        const roomId = generateRoomId();

        const room = await Room.create({
            roomId,
            name,
            host: req.user.id,
            videoId: videoId || ""
        });

        await History.create({
            roomId: room.roomId,
            roomName: room.name,
            host: req.user.id,
            videoId: room.videoId,
            participants: []
        });

        res.status(201).json({
            message: "Room created successfully",
            room
        });
    } catch (error) {
        res.status(500).json({
            message: "Unable to create room"
        });
    }
};

export const getRooms = async (req, res) => {
    try {
        const rooms = await Room.find({
            host: req.user.id,
            isActive: true
        }).sort({
            createdAt: -1
        });

        res.status(200).json({
            rooms
        });
    } catch (error) {
        res.status(500).json({
            message: "Unable to fetch rooms"
        });
    }
};

export const getRoom = async (req, res) => {
    try {
        const room = await Room.findOne({
            roomId: req.params.roomId
        }).populate("host", "username email");

        if (!room) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        res.status(200).json({
            room
        });
    } catch (error) {
        res.status(500).json({
            message: "Unable to fetch room"
        });
    }
};

export const joinRoom = async (req, res) => {
    try {
        const room = await Room.findOne({
            roomId: req.params.roomId,
            isActive: true
        });

        if (!room) {
            return res.status(404).json({
                message: "Room not found or inactive"
            });
        }

        res.status(200).json({
            message: "Room found",
            room
        });
    } catch (error) {
        res.status(500).json({
            message: "Unable to join room"
        });
    }
};

export const endRoom = async (req, res) => {
    try {
        const room = await Room.findOne({
            roomId: req.params.roomId
        });

        if (!room) {
            return res.status(404).json({
                message: "Room not found"
            });
        }

        if (room.host.toString() !== req.user.id) {
            return res.status(403).json({
                message: "Only the host can end the room"
            });
        }

        room.isActive = false;
        room.lastActive = new Date();

        await room.save();

        await History.findOneAndUpdate(
            {
                roomId: room.roomId,
                host: req.user.id
            },
            {
                endedAt: new Date(),
                videoId: room.videoId
            },
            {
                sort: {
                    startedAt: -1
                }
            }
        );

        res.status(200).json({
            message: "Room ended successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Unable to end room"
        });
    }
};

export const getHistory = async (req, res) => {
    try {
        const history = await History.find({
            host: req.user.id
        })
            .sort({
                startedAt: -1
            })
            .populate("host", "username email");

        res.status(200).json({
            history
        });
    } catch (error) {
        res.status(500).json({
            message: "Unable to fetch room history"
        });
    }
};