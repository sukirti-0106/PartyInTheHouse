import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Room from "../models/room.model.js";
import History from "../models/history.model.js";

const rooms = {};

const canControlVideo = (role) => {
    return role === "Host" || role === "Moderator";
};

const getParticipants = (room) => {
    return Object.values(room.participants);
};

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            const guestId = socket.handshake.auth?.guestId;
            const guestName = socket.handshake.auth?.guestName;

            if (token) {
                const decoded = jwt.verify(
                    token,
                    process.env.JWT_SECRET
                );

                socket.user = decoded;
                socket.isGuest = false;

                return next();
            }

            if (guestId && guestName) {
                socket.user = {
                    id: guestId,
                    username: guestName
                };

                socket.isGuest = true;

                return next();
            }

            return next(
                new Error("Authentication required")
            );
        } catch (error) {
            console.log(
                "Socket authentication error:",
                error
            );

            return next(
                new Error("Invalid authentication")
            );
        }
    });

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on(
            "join_room",
            async ({
                roomId,
                username,
                createRoom,
                videoId,
                roomName
            }) => {
                try {
                    if (!roomId) {
                        socket.emit("room_error", {
                            message: "Room code is required"
                        });

                        return;
                    }

                    let room = await Room.findOne({
                        roomId
                    });

                    if (
                        createRoom &&
                        !rooms[roomId]
                    ) {
                        rooms[roomId] = {
                            roomId,
                            videoId:
                                videoId ||
                                room?.videoId ||
                                "",
                            roomName:
                                roomName ||
                                "Watch Party",
                            currentTime: 0,
                            playState: "paused",
                            vibe: "Normal",
                            queue: [],
                            participants: {},
                            hostUserId:
                                socket.user.id,
                            persistent: !!room
                        };
                    }

                    if (
                        !rooms[roomId] &&
                        room
                    ) {
                        rooms[roomId] = {
                            roomId,
                            videoId:
                                room.videoId ||
                                "",
                            roomName:
                                room.roomName ||
                                room.name ||
                                "Watch Party",
                            currentTime: 0,
                            playState: "paused",
                            vibe: "Normal",
                            queue: [],
                            participants: {},
                            hostUserId:
                                room.host
                                    ? room.host.toString()
                                    : null,
                            persistent: true
                        };
                    }

                    if (!rooms[roomId]) {
                        socket.emit("room_error", {
                            message:
                                "Room not found. Check the room code."
                        });

                        return;
                    }

                    if (
                        createRoom &&
                        rooms[roomId].participants &&
                        Object.keys(
                            rooms[roomId].participants
                        ).length > 0 &&
                        rooms[roomId].hostUserId !==
                            socket.user.id
                    ) {
                        socket.emit("room_error", {
                            message:
                                "Room already exists"
                        });

                        return;
                    }

                    socket.join(roomId);
                    socket.roomId = roomId;

                    const currentRoom =
                        rooms[roomId];

                    let role = "Participant";

                    if (
                        currentRoom.hostUserId ===
                        socket.user.id
                    ) {
                        role = "Host";
                    }

                    if (
                        room &&
                        room.host &&
                        room.host.toString() ===
                            socket.user.id
                    ) {
                        role = "Host";

                        currentRoom.hostUserId =
                            socket.user.id;
                    }

                    currentRoom.participants[
                        socket.id
                    ] = {
                        userId:
                            socket.user.id,
                        username:
                            username ||
                            socket.user.username ||
                            "User",
                        role,
                        socketId: socket.id
                    };

                    if (
                        role === "Host" &&
                        currentRoom.persistent
                    ) {
                        await Room.findOneAndUpdate(
                            {
                                roomId
                            },
                            {
                                host:
                                    socket.user.id,
                                videoId:
                                    currentRoom.videoId,
                                lastActive:
                                    new Date()
                            }
                        );
                    }

                    const participants =
                        getParticipants(
                            currentRoom
                        );

                    io.to(roomId).emit(
                        "user_joined",
                        {
                            userId:
                                socket.user.id,
                            username:
                                username ||
                                socket.user.username ||
                                "User",
                            role,
                            roomName:
                                currentRoom.roomName,
                            participants
                        }
                    );

                    socket.emit(
                        "sync_state",
                        {
                            playState:
                                currentRoom.playState,
                            currentTime:
                                currentRoom.currentTime,
                            videoId:
                                currentRoom.videoId,
                            vibe:
                                currentRoom.vibe,
                            queue:
                                currentRoom.queue,
                            roomName:
                                currentRoom.roomName
                        }
                    );
                } catch (error) {
                    console.log(
                        "join room error",
                        error
                    );

                    socket.emit(
                        "room_error",
                        {
                            message:
                                "Unable to join room"
                        }
                    );
                }
            }
        );

        socket.on(
            "leave_room",
            async () => {
                try {
                    const roomId =
                        socket.roomId;

                    if (
                        !roomId ||
                        !rooms[roomId]
                    ) {
                        return;
                    }

                    const currentRoom =
                        rooms[roomId];

                    const leavingUser =
                        currentRoom.participants[
                            socket.id
                        ];

                    delete currentRoom.participants[
                        socket.id
                    ];

                    let participants =
                        getParticipants(
                            currentRoom
                        );

                    io.to(roomId).emit(
                        "user_left",
                        {
                            userId:
                                socket.user.id,
                            participants
                        }
                    );

                    if (
                        leavingUser &&
                        leavingUser.role ===
                            "Host" &&
                        participants.length > 0
                    ) {
                        const newHost =
                            participants[0];

                        newHost.role = "Host";

                        currentRoom.hostUserId =
                            newHost.userId;

                        if (
                            currentRoom.persistent
                        ) {
                            await Room.findOneAndUpdate(
                                {
                                    roomId
                                },
                                {
                                    host:
                                        newHost.userId,
                                    lastActive:
                                        new Date()
                                }
                            );
                        }

                        participants =
                            getParticipants(
                                currentRoom
                            );

                        io.to(roomId).emit(
                            "role_assigned",
                            {
                                userId:
                                    newHost.userId,
                                username:
                                    newHost.username,
                                role: "Host",
                                participants
                            }
                        );
                    }

                    if (
                        participants.length === 0
                    ) {
                        if (
                            currentRoom.persistent
                        ) {
                            await History.findOneAndUpdate(
                                {
                                    roomId
                                },
                                {
                                    endedAt:
                                        new Date()
                                }
                            );
                        }

                        delete rooms[
                            roomId
                        ];
                    }

                    socket.leave(roomId);
                    socket.roomId = null;
                } catch (error) {
                    console.log(
                        "leave room error",
                        error
                    );
                }
            }
        );

        socket.on("play", () => {
            try {
                const roomId =
                    socket.roomId;

                if (
                    !roomId ||
                    !rooms[roomId]
                ) {
                    return;
                }

                const participant =
                    rooms[roomId].participants[
                        socket.id
                    ];

                if (!participant) {
                    return;
                }

                if (
                    !canControlVideo(
                        participant.role
                    )
                ) {
                    return;
                }

                rooms[roomId].playState =
                    "playing";

                io.to(roomId).emit("play");
            } catch (error) {
                console.log(
                    "play error",
                    error
                );
            }
        });

        socket.on("pause", () => {
            try {
                const roomId =
                    socket.roomId;

                if (
                    !roomId ||
                    !rooms[roomId]
                ) {
                    return;
                }

                const participant =
                    rooms[roomId].participants[
                        socket.id
                    ];

                if (!participant) {
                    return;
                }

                if (
                    !canControlVideo(
                        participant.role
                    )
                ) {
                    return;
                }

                rooms[roomId].playState =
                    "paused";

                io.to(roomId).emit("pause");
            } catch (error) {
                console.log(
                    "pause error",
                    error
                );
            }
        });

        socket.on(
            "seek",
            ({ time }) => {
                try {
                    const roomId =
                        socket.roomId;

                    if (
                        !roomId ||
                        !rooms[roomId]
                    ) {
                        return;
                    }

                    const participant =
                        rooms[roomId]
                            .participants[
                            socket.id
                        ];

                    if (!participant) {
                        return;
                    }

                    if (
                        !canControlVideo(
                            participant.role
                        )
                    ) {
                        return;
                    }

                    if (
                        typeof time !==
                        "number"
                    ) {
                        return;
                    }

                    rooms[roomId]
                        .currentTime =
                        time;

                    io.to(roomId).emit(
                        "seek",
                        {
                            time
                        }
                    );
                } catch (error) {
                    console.log(
                        "seek error",
                        error
                    );
                }
            }
        );

        socket.on(
            "change_video",
            async ({ videoId }) => {
                try {
                    const roomId =
                        socket.roomId;

                    if (
                        !roomId ||
                        !rooms[roomId]
                    ) {
                        return;
                    }

                    const participant =
                        rooms[roomId]
                            .participants[
                            socket.id
                        ];

                    if (
                        !participant ||
                        participant.role !==
                            "Host"
                    ) {
                        return;
                    }

                    if (!videoId) {
                        return;
                    }

                    rooms[roomId].videoId =
                        videoId;

                    rooms[roomId]
                        .currentTime = 0;

                    rooms[roomId]
                        .playState =
                        "paused";

                    if (
                        rooms[roomId]
                            .persistent
                    ) {
                        await Room.findOneAndUpdate(
                            {
                                roomId
                            },
                            {
                                videoId,
                                lastActive:
                                    new Date()
                            }
                        );
                    }

                    io.to(roomId).emit(
                        "change_video",
                        {
                            videoId
                        }
                    );

                    io.to(roomId).emit(
                        "sync_state",
                        {
                            videoId,
                            currentTime: 0,
                            playState:
                                "paused",
                            vibe:
                                rooms[
                                    roomId
                                ].vibe,
                            queue:
                                rooms[
                                    roomId
                                ].queue,
                            roomName:
                                rooms[
                                    roomId
                                ].roomName
                        }
                    );
                } catch (error) {
                    console.log(
                        "change video error",
                        error
                    );
                }
            }
        );

        socket.on(
            "add_to_queue",
            ({ videoId }) => {
                try {
                    const roomId =
                        socket.roomId;

                    if (
                        !roomId ||
                        !rooms[roomId]
                    ) {
                        return;
                    }

                    const participant =
                        rooms[roomId]
                            .participants[
                            socket.id
                        ];

                    if (!participant) {
                        return;
                    }

                    if (
                        !canControlVideo(
                            participant.role
                        )
                    ) {
                        return;
                    }

                    if (
                        !videoId ||
                        typeof videoId !==
                            "string"
                    ) {
                        return;
                    }

                    const cleanVideoId =
                        videoId.trim();

                    if (!cleanVideoId) {
                        return;
                    }

                    rooms[roomId].queue.push(
                        cleanVideoId
                    );

                    io.to(roomId).emit(
                        "queue_updated",
                        {
                            queue:
                                rooms[
                                    roomId
                                ].queue
                        }
                    );
                } catch (error) {
                    console.log(
                        "add to queue error",
                        error
                    );
                }
            }
        );

        socket.on(
            "remove_from_queue",
            ({ index }) => {
                try {
                    const roomId =
                        socket.roomId;

                    if (
                        !roomId ||
                        !rooms[roomId]
                    ) {
                        return;
                    }

                    const participant =
                        rooms[roomId]
                            .participants[
                            socket.id
                        ];

                    if (!participant) {
                        return;
                    }

                    if (
                        !canControlVideo(
                            participant.role
                        )
                    ) {
                        return;
                    }

                    if (
                        typeof index !==
                            "number" ||
                        index < 0 ||
                        index >=
                            rooms[roomId]
                                .queue.length
                    ) {
                        return;
                    }

                    rooms[roomId]
                        .queue.splice(
                            index,
                            1
                        );

                    io.to(roomId).emit(
                        "queue_updated",
                        {
                            queue:
                                rooms[
                                    roomId
                                ].queue
                        }
                    );
                } catch (error) {
                    console.log(
                        "remove from queue error",
                        error
                    );
                }
            }
        );

        socket.on(
            "video_ended",
            () => {
                try {
                    const roomId =
                        socket.roomId;

                    if (
                        !roomId ||
                        !rooms[roomId]
                    ) {
                        return;
                    }

                    const participant =
                        rooms[roomId]
                            .participants[
                            socket.id
                        ];

                    if (
                        !participant ||
                        participant.role !==
                            "Host"
                    ) {
                        return;
                    }

                    if (
                        rooms[roomId]
                            .queue.length ===
                        0
                    ) {
                        rooms[roomId]
                            .playState =
                            "paused";

                        return;
                    }

                    const nextVideo =
                        rooms[roomId]
                            .queue.shift();

                    rooms[roomId].videoId =
                        nextVideo;

                    rooms[roomId]
                        .currentTime = 0;

                    rooms[roomId]
                        .playState =
                        "playing";

                    io.to(roomId).emit(
                        "change_video",
                        {
                            videoId:
                                nextVideo
                        }
                    );

                    io.to(roomId).emit(
                        "queue_updated",
                        {
                            queue:
                                rooms[
                                    roomId
                                ].queue
                        }
                    );

                    io.to(roomId).emit(
                        "play"
                    );
                } catch (error) {
                    console.log(
                        "video ended error",
                        error
                    );
                }
            }
        );

        socket.on(
            "change_vibe",
            ({ vibe }) => {
                try {
                    const roomId =
                        socket.roomId;

                    if (
                        !roomId ||
                        !rooms[roomId]
                    ) {
                        return;
                    }

                    const currentUser =
                        rooms[roomId]
                            .participants[
                            socket.id
                        ];

                    if (
                        !currentUser ||
                        currentUser.role !==
                            "Host"
                    ) {
                        return;
                    }

                    const allowedVibes = [
                        "Normal",
                        "Movie Night",
                        "Late Night",
                        "Party",
                        "Romantic",
                        "Chill",
                        "Workplace"
                    ];

                    if (
                        !allowedVibes.includes(
                            vibe
                        )
                    ) {
                        return;
                    }

                    rooms[roomId].vibe =
                        vibe;

                    io.to(roomId).emit(
                        "room_vibe_changed",
                        {
                            vibe
                        }
                    );
                } catch (error) {
                    console.log(
                        "change vibe error",
                        error
                    );
                }
            }
        );

        socket.on(
            "assign_role",
            async ({
                userId,
                role
            }) => {
                try {
                    const roomId =
                        socket.roomId;

                    if (
                        !roomId ||
                        !rooms[roomId]
                    ) {
                        return;
                    }

                    const currentUser =
                        rooms[roomId]
                            .participants[
                            socket.id
                        ];

                    if (
                        !currentUser ||
                        currentUser.role !==
                            "Host"
                    ) {
                        return;
                    }

                    if (
                        role !== "Host" &&
                        role !== "Moderator" &&
                        role !== "Participant"
                    ) {
                        return;
                    }

                    const participantEntry =
                        Object.entries(
                            rooms[roomId]
                                .participants
                        ).find(
                            ([, user]) =>
                                user.userId ===
                                userId
                        );

                    if (!participantEntry) {
                        return;
                    }

                    const [
                        participantSocketId,
                        participant
                    ] = participantEntry;

                    if (
                        participant.userId ===
                        currentUser.userId
                    ) {
                        return;
                    }

                    /*
                     * HOST TRANSFER
                     */
                    if (role === "Host") {
                        const oldHostUserId =
                            currentUser.userId;

                        const oldHostUsername =
                            currentUser.username;

                        const newHostUserId =
                            participant.userId;

                        const newHostUsername =
                            participant.username;

                        currentUser.role =
                            "Participant";

                        participant.role =
                            "Host";

                        rooms[roomId]
                            .hostUserId =
                            newHostUserId;

                        if (
                            rooms[roomId]
                                .persistent
                        ) {
                            await Room.findOneAndUpdate(
                                {
                                    roomId
                                },
                                {
                                    host:
                                        newHostUserId,
                                    lastActive:
                                        new Date()
                                }
                            );
                        }

                        const participants =
                            getParticipants(
                                rooms[roomId]
                            );

                        /*
                         * IMPORTANT:
                         * Send role update for
                         * OLD HOST
                         */
                        io.to(roomId).emit(
                            "role_assigned",
                            {
                                userId:
                                    oldHostUserId,
                                username:
                                    oldHostUsername,
                                role:
                                    "Participant",
                                participants
                            }
                        );

                        /*
                         * Send role update for
                         * NEW HOST
                         */
                        io.to(roomId).emit(
                            "role_assigned",
                            {
                                userId:
                                    newHostUserId,
                                username:
                                    newHostUsername,
                                role: "Host",
                                participants
                            }
                        );

                        console.log(
                            `Host transferred from ${oldHostUserId} to ${newHostUserId}`
                        );

                        return;
                    }

                    /*
                     * MODERATOR / PARTICIPANT
                     */
                    participant.role =
                        role;

                    const participants =
                        getParticipants(
                            rooms[roomId]
                        );

                    io.to(roomId).emit(
                        "role_assigned",
                        {
                            userId:
                                participant.userId,
                            username:
                                participant.username,
                            role:
                                participant.role,
                            participants
                        }
                    );
                } catch (error) {
                    console.log(
                        "role assignment error",
                        error
                    );
                }
            }
        );

        socket.on(
            "remove_participant",
            ({ userId }) => {
                try {
                    const roomId =
                        socket.roomId;

                    if (
                        !roomId ||
                        !rooms[roomId]
                    ) {
                        return;
                    }

                    const currentUser =
                        rooms[roomId]
                            .participants[
                            socket.id
                        ];

                    if (
                        !currentUser ||
                        currentUser.role !==
                            "Host"
                    ) {
                        return;
                    }

                    const participantEntry =
                        Object.entries(
                            rooms[roomId]
                                .participants
                        ).find(
                            ([, user]) =>
                                user.userId ===
                                userId
                        );

                    if (!participantEntry) {
                        return;
                    }

                    const [
                        participantSocketId,
                        participant
                    ] = participantEntry;

                    if (
                        participant.userId ===
                        currentUser.userId
                    ) {
                        return;
                    }

                    delete rooms[
                        roomId
                    ].participants[
                        participantSocketId
                    ];

                    const removedSocket =
                        io.sockets.sockets.get(
                            participantSocketId
                        );

                    if (removedSocket) {
                        removedSocket.leave(
                            roomId
                        );

                        removedSocket.roomId =
                            null;

                        removedSocket.emit(
                            "participant_removed",
                            {
                                userId:
                                    participant.userId
                            }
                        );
                    }

                    const participants =
                        getParticipants(
                            rooms[roomId]
                        );

                    io.to(roomId).emit(
                        "participant_removed",
                        {
                            userId:
                                participant.userId,
                            participants
                        }
                    );
                } catch (error) {
                    console.log(
                        "remove participant error",
                        error
                    );
                }
            }
        );

        socket.on(
            "send_message",
            ({ message }) => {
                try {
                    const roomId =
                        socket.roomId;

                    if (
                        !roomId ||
                        !rooms[roomId]
                    ) {
                        return;
                    }

                    const participant =
                        rooms[roomId]
                            .participants[
                            socket.id
                        ];

                    if (
                        !participant ||
                        !message?.trim()
                    ) {
                        return;
                    }

                    io.to(roomId).emit(
                        "receive_message",
                        {
                            userId:
                                participant.userId,
                            username:
                                participant.username,
                            message:
                                message.trim()
                        }
                    );
                } catch (error) {
                    console.log(
                        "message error",
                        error
                    );
                }
            }
        );

        socket.on(
            "reaction",
            ({ reaction }) => {
                try {
                    const roomId =
                        socket.roomId;

                    if (
                        !roomId ||
                        !rooms[roomId]
                    ) {
                        return;
                    }

                    const participant =
                        rooms[roomId]
                            .participants[
                            socket.id
                        ];

                    if (
                        !participant ||
                        !reaction
                    ) {
                        return;
                    }

                    io.to(roomId).emit(
                        "new_reaction",
                        {
                            id:
                                Date.now() +
                                Math.random(),
                            userId:
                                participant.userId,
                            username:
                                participant.username,
                            reaction
                        }
                    );
                } catch (error) {
                    console.log(
                        "reaction error",
                        error
                    );
                }
            }
        );

        socket.on(
            "disconnect",
            async () => {
                try {
                    const roomId =
                        socket.roomId;

                    if (
                        !roomId ||
                        !rooms[roomId]
                    ) {
                        return;
                    }

                    delete rooms[
                        roomId
                    ].participants[
                        socket.id
                    ];

                    const participants =
                        getParticipants(
                            rooms[roomId]
                        );

                    io.to(roomId).emit(
                        "user_left",
                        {
                            userId:
                                socket.user.id,
                            participants
                        }
                    );

                    if (
                        participants.length ===
                        0
                    ) {
                        if (
                            rooms[roomId]
                                .persistent
                        ) {
                            await History.findOneAndUpdate(
                                {
                                    roomId
                                },
                                {
                                    endedAt:
                                        new Date()
                                }
                            );
                        }

                        delete rooms[
                            roomId
                        ];
                    }
                } catch (error) {
                    console.log(
                        "disconnect error",
                        error
                    );
                }
            }
        );
    });

    return io;
};