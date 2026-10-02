import express from "express";
import "dotenv/config";
import { createServer } from "node:http";
import cors from "cors";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketController.js";
import userRoutes from "./routes/user.routes.js";

import roomRoutes from "./routes/room.routes.js";

const app = express();
const server = createServer(app);

app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);

app.use("/api/rooms", roomRoutes);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");
    } catch (error) {
        console.log("MongoDB connection failed", error);
    }
};

connectDB();

connectToSocket(server);

app.get("/", (req, res) => {
    res.send("Watch Party Backend is running");
});

const port = 8080;

server.listen(port, () => {
    console.log(`listening on port ${port}`);
});