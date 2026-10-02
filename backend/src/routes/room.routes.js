import express from "express";
import {
    createRoom,
    getRooms,
    getRoom,
    joinRoom,
    endRoom,
    getHistory
} from "../controllers/room.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/create", authMiddleware, createRoom);
router.get("/", authMiddleware, getRooms);
router.get("/history", authMiddleware, getHistory);
router.get("/:roomId", authMiddleware, getRoom);
router.post("/:roomId/join", authMiddleware, joinRoom);
router.post("/:roomId/end", authMiddleware, endRoom);

export default router;