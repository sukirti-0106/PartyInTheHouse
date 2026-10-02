import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import styles from "../styles/WatchParty.module.css";

const SOCKET_URL = "https://partyinthehouse.onrender.com";

const WatchParty = () => {
    const socketRef = useRef(null);
    const videoRef = useRef(null);
    const roleRef = useRef("Participant");

    const [roomId, setRoomId] = useState("");
    const [roomName, setRoomName] = useState("Watch Party");
    const [videoId, setVideoId] = useState("");
    const [videoInput, setVideoInput] = useState("");

    const [role, setRole] = useState("Participant");
    const [participants, setParticipants] = useState([]);

    const [playState, setPlayState] = useState("paused");
    const [currentTime, setCurrentTime] = useState(0);

    const [queue, setQueue] = useState([]);
    const [queueInput, setQueueInput] = useState("");

    const [vibe, setVibe] = useState("Normal");

    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState("");

    const [reactions, setReactions] = useState([]);

    const [username, setUsername] = useState(
        localStorage.getItem("username") || "User"
    );

    const [currentUserId, setCurrentUserId] = useState("");

    const canControl =
        role === "Host" ||
        role === "Moderator";

    const isHost = role === "Host";

    useEffect(() => {
        const token = localStorage.getItem("token");

        const guestId =
            localStorage.getItem("guestId");

        const guestName =
            localStorage.getItem("guestName");

        let userId = "";

        if (token) {
            try {
                const payload = JSON.parse(
                    atob(token.split(".")[1])
                );

                userId =
                    payload.id ||
                    payload._id ||
                    "";
            } catch (error) {
                console.log(
                    "Unable to read token"
                );
            }
        }

        if (!userId && guestId) {
            userId = guestId;
        }

        setCurrentUserId(userId);

        socketRef.current = io(
            SOCKET_URL,
            {
                auth: {
                    token,
                    guestId,
                    guestName
                }
            }
        );

        const socket =
            socketRef.current;

        socket.on("connect", () => {
            console.log(
                "Connected:",
                socket.id
            );
        });

        socket.on(
            "user_joined",
            (data) => {
                setParticipants(
                    data.participants || []
                );

                if (data.roomName) {
                    setRoomName(
                        data.roomName
                    );
                }

                if (
                    data.userId ===
                    userId
                ) {
                    setRole(
                        data.role
                    );

                    roleRef.current =
                        data.role;
                }
            }
        );

        socket.on(
            "user_left",
            (data) => {
                setParticipants(
                    data.participants || []
                );
            }
        );

        /*
         * IMPORTANT:
         * This handles both old host
         * and new host after transfer.
         */
        socket.on(
            "role_assigned",
            (data) => {
                if (
                    data.participants
                ) {
                    setParticipants(
                        data.participants
                    );
                } else {
                    setParticipants(
                        (prev) =>
                            prev.map(
                                (participant) =>
                                    participant.userId ===
                                    data.userId
                                        ? {
                                              ...participant,
                                              role:
                                                  data.role
                                          }
                                        : participant
                            )
                    );
                }

                if (
                    data.userId ===
                    userId
                ) {
                    setRole(
                        data.role
                    );

                    roleRef.current =
                        data.role;
                }
            }
        );

        socket.on(
            "participant_removed",
            (data) => {
                if (
                    data.userId ===
                    userId
                ) {
                    alert(
                        "You were removed from the room."
                    );

                    window.location.href =
                        "/";
                    return;
                }

                if (
                    data.participants
                ) {
                    setParticipants(
                        data.participants
                    );
                }
            }
        );

        socket.on(
            "sync_state",
            (data) => {
                if (
                    data.videoId !==
                    undefined
                ) {
                    setVideoId(
                        data.videoId
                    );
                }

                if (
                    data.playState
                ) {
                    setPlayState(
                        data.playState
                    );
                }

                if (
                    typeof data.currentTime ===
                    "number"
                ) {
                    setCurrentTime(
                        data.currentTime
                    );
                }

                if (
                    data.queue
                ) {
                    setQueue(
                        data.queue
                    );
                }

                if (
                    data.vibe
                ) {
                    setVibe(
                        data.vibe
                    );
                }

                if (
                    data.roomName
                ) {
                    setRoomName(
                        data.roomName
                    );
                }
            }
        );

        socket.on(
            "play",
            () => {
                setPlayState(
                    "playing"
                );
            }
        );

        socket.on(
            "pause",
            () => {
                setPlayState(
                    "paused"
                );
            }
        );

        socket.on(
            "seek",
            ({ time }) => {
                setCurrentTime(
                    time
                );
            }
        );

        socket.on(
            "change_video",
            ({ videoId }) => {
                setVideoId(
                    videoId
                );

                setCurrentTime(
                    0
                );

                setPlayState(
                    "paused"
                );
            }
        );

        socket.on(
            "queue_updated",
            ({ queue }) => {
                setQueue(
                    queue || []
                );
            }
        );

        socket.on(
            "room_vibe_changed",
            ({ vibe }) => {
                setVibe(
                    vibe
                );
            }
        );

        socket.on(
            "receive_message",
            (data) => {
                setMessages(
                    (prev) => [
                        ...prev,
                        data
                    ]
                );
            }
        );

        socket.on(
            "new_reaction",
            (data) => {
                setReactions(
                    (prev) => [
                        ...prev,
                        data
                    ]
                );

                setTimeout(() => {
                    setReactions(
                        (prev) =>
                            prev.filter(
                                (reaction) =>
                                    reaction.id !==
                                    data.id
                            )
                    );
                }, 3000);
            }
        );

        socket.on(
            "room_error",
            ({ message }) => {
                alert(message);
            }
        );

        socket.on(
            "connect_error",
            (error) => {
                console.log(
                    "Socket error:",
                    error.message
                );
            }
        );

        return () => {
            socket.disconnect();
        };
    }, []);

    const getYouTubeId = (
        value
    ) => {
        if (!value) {
            return "";
        }

        if (
            value.length === 11 &&
            !value.includes("/")
        ) {
            return value;
        }

        try {
            const url =
                new URL(value);

            if (
                url.hostname.includes(
                    "youtu.be"
                )
            ) {
                return url.pathname
                    .replace("/", "")
                    .trim();
            }

            if (
                url.hostname.includes(
                    "youtube.com"
                )
            ) {
                return (
                    url.searchParams.get(
                        "v"
                    ) || ""
                );
            }
        } catch (error) {
            return "";
        }

        return "";
    };

    const joinRoom = () => {
        if (!roomId.trim()) {
            alert(
                "Enter room code"
            );
            return;
        }

        socketRef.current.emit(
            "join_room",
            {
                roomId:
                    roomId.trim(),
                username:
                    username.trim() ||
                    "User",
                createRoom: false
            }
        );
    };

    const createRoom = () => {
        const cleanVideoId =
            getYouTubeId(
                videoInput
            );

        if (!cleanVideoId) {
            alert(
                "Enter a valid YouTube video"
            );
            return;
        }

        if (!roomId.trim()) {
            alert(
                "Enter room code"
            );
            return;
        }

        socketRef.current.emit(
            "join_room",
            {
                roomId:
                    roomId.trim(),
                username:
                    username.trim() ||
                    "User",
                createRoom: true,
                videoId:
                    cleanVideoId,
                roomName:
                    roomName ||
                    "Watch Party"
            }
        );
    };

    const handlePlay = () => {
        if (!canControl) {
            return;
        }

        socketRef.current.emit(
            "play"
        );
    };

    const handlePause = () => {
        if (!canControl) {
            return;
        }

        socketRef.current.emit(
            "pause"
        );
    };

    const handleSeek = (
        event
    ) => {
        if (!canControl) {
            return;
        }

        const time =
            Number(
                event.target.value
            );

        setCurrentTime(
            time
        );

        socketRef.current.emit(
            "seek",
            {
                time
            }
        );
    };

    const handleChangeVideo = () => {
        if (!isHost) {
            return;
        }

        const cleanVideoId =
            getYouTubeId(
                videoInput
            );

        if (!cleanVideoId) {
            alert(
                "Enter a valid YouTube video"
            );
            return;
        }

        socketRef.current.emit(
            "change_video",
            {
                videoId:
                    cleanVideoId
            }
        );
    };

    const addToQueue = () => {
        if (!canControl) {
            return;
        }

        const cleanVideoId =
            getYouTubeId(
                queueInput
            );

        if (!cleanVideoId) {
            alert(
                "Enter a valid YouTube video"
            );
            return;
        }

        socketRef.current.emit(
            "add_to_queue",
            {
                videoId:
                    cleanVideoId
            }
        );

        setQueueInput("");
    };

    const removeFromQueue = (
        index
    ) => {
        if (!canControl) {
            return;
        }

        socketRef.current.emit(
            "remove_from_queue",
            {
                index
            }
        );
    };

    const changeVibe = (
        newVibe
    ) => {
        if (!isHost) {
            return;
        }

        socketRef.current.emit(
            "change_vibe",
            {
                vibe: newVibe
            }
        );
    };

    const sendMessage = () => {
        if (
            !messageInput.trim()
        ) {
            return;
        }

        socketRef.current.emit(
            "send_message",
            {
                message:
                    messageInput.trim()
            }
        );

        setMessageInput("");
    };

    const sendReaction = (
        reaction
    ) => {
        socketRef.current.emit(
            "reaction",
            {
                reaction
            }
        );
    };

    const assignRole = (
        userId,
        newRole
    ) => {
        if (!isHost) {
            return;
        }

        socketRef.current.emit(
            "assign_role",
            {
                userId,
                role: newRole
            }
        );
    };

    const removeParticipant = (
        userId
    ) => {
        if (!isHost) {
            return;
        }

        socketRef.current.emit(
            "remove_participant",
            {
                userId
            }
        );
    };

    const leaveRoom = () => {
        socketRef.current.emit(
            "leave_room"
        );

        window.location.href =
            "/";
    };

    const getVideoUrl = () => {
        if (!videoId) {
            return "";
        }

        return `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
    };

    return (
        <div className={styles.page}>
            <header
                className={
                    styles.header
                }
            >
                <div>
                    <h1>
                        {roomName}
                    </h1>

                    <div
                        className={
                            styles.roleText
                        }
                    >
                        You are:{" "}
                        <strong>
                            {role}
                        </strong>
                    </div>
                </div>

                <div
                    className={
                        styles.headerRight
                    }
                >
                    <span>
                        Room:{" "}
                        <strong>
                            {roomId}
                        </strong>
                    </span>

                    <button
                        className={
                            styles.leaveButton
                        }
                        onClick={
                            leaveRoom
                        }
                    >
                        Leave
                    </button>
                </div>
            </header>

            <div
                className={
                    styles.container
                }
            >
                <main
                    className={
                        styles.main
                    }
                >
                    <section
                        className={
                            styles.videoSection
                        }
                    >
                        <div
                            className={
                                styles.videoWrapper
                            }
                        >
                            {videoId ? (
                                <iframe
                                    ref={
                                        videoRef
                                    }
                                    src={getVideoUrl()}
                                    title="Watch Party Video"
                                    className={
                                        styles.video
                                    }
                                    allow="autoplay; encrypted-media; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <div
                                    className={
                                        styles.noVideo
                                    }
                                >
                                    No video selected
                                </div>
                            )}
                        </div>

                        <div
                            className={
                                styles.controls
                            }
                        >
                            <button
                                className={`${styles.button} ${styles.primaryButton}`}
                                onClick={
                                    handlePlay
                                }
                                disabled={
                                    !canControl
                                }
                            >
                                ▶ Play
                            </button>

                            <button
                                className={`${styles.button} ${styles.secondaryButton}`}
                                onClick={
                                    handlePause
                                }
                                disabled={
                                    !canControl
                                }
                            >
                                ⏸ Pause
                            </button>

                            <button
                                className={`${styles.button} ${styles.secondaryButton}`}
                                onClick={() => {
                                    if (
                                        canControl
                                    ) {
                                        socketRef.current.emit(
                                            "seek",
                                            {
                                                time: currentTime
                                            }
                                        );
                                    }
                                }}
                                disabled={
                                    !canControl
                                }
                            >
                                Sync
                            </button>
                        </div>

                        <div
                            className={
                                styles.seekContainer
                            }
                        >
                            <input
                                type="range"
                                min="0"
                                max="3600"
                                value={
                                    currentTime
                                }
                                onChange={
                                    handleSeek
                                }
                                disabled={
                                    !canControl
                                }
                                className={
                                    styles.seek
                                }
                            />

                            <span>
                                {Math.floor(
                                    currentTime
                                )}{" "}
                                sec
                            </span>
                        </div>
                    </section>

                    <section
                        className={
                            styles.card
                        }
                    >
                        <h2>
                            Video
                        </h2>

                        <div
                            className={
                                styles.inputRow
                            }
                        >
                            <input
                                className={
                                    styles.input
                                }
                                value={
                                    videoInput
                                }
                                onChange={(
                                    e
                                ) =>
                                    setVideoInput(
                                        e.target
                                            .value
                                    )
                                }
                                placeholder="YouTube URL"
                            />

                            <button
                                className={
                                    styles.button
                                }
                                onClick={
                                    handleChangeVideo
                                }
                                disabled={
                                    !isHost
                                }
                            >
                                Change Video
                            </button>
                        </div>
                    </section>

                    <section
                        className={
                            styles.card
                        }
                    >
                        <h2>
                            Queue
                        </h2>

                        <div
                            className={
                                styles.inputRow
                            }
                        >
                            <input
                                className={
                                    styles.input
                                }
                                value={
                                    queueInput
                                }
                                onChange={(
                                    e
                                ) =>
                                    setQueueInput(
                                        e.target
                                            .value
                                    )
                                }
                                placeholder="YouTube URL"
                            />

                            <button
                                className={
                                    styles.button
                                }
                                onClick={
                                    addToQueue
                                }
                                disabled={
                                    !canControl
                                }
                            >
                                Add
                            </button>
                        </div>

                        <div
                            className={
                                styles.queue
                            }
                        >
                            {queue.length ===
                            0 ? (
                                <p
                                    className={
                                        styles.empty
                                    }
                                >
                                    Queue is empty
                                </p>
                            ) : (
                                queue.map(
                                    (
                                        item,
                                        index
                                    ) => (
                                        <div
                                            key={
                                                index
                                            }
                                            className={
                                                styles.queueItem
                                            }
                                        >
                                            <span>
                                                {item}
                                            </span>

                                            <button
                                                className={
                                                    styles.smallButton
                                                }
                                                onClick={() =>
                                                    removeFromQueue(
                                                        index
                                                    )
                                                }
                                                disabled={
                                                    !canControl
                                                }
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )
                                )
                            )}
                        </div>
                    </section>

                    <section
                        className={
                            styles.card
                        }
                    >
                        <h2>
                            Room Vibe
                        </h2>

                        <div
                            className={
                                styles.vibeButtons
                            }
                        >
                            {[
                                "Normal",
                                "Movie Night",
                                "Late Night",
                                "Party",
                                "Romantic",
                                "Chill",
                                "Workplace"
                            ].map(
                                (
                                    item
                                ) => (
                                    <button
                                        key={
                                            item
                                        }
                                        className={`${styles.vibeButton} ${
                                            vibe ===
                                            item
                                                ? styles.activeVibe
                                                : ""
                                        }`}
                                        onClick={() =>
                                            changeVibe(
                                                item
                                            )
                                        }
                                        disabled={
                                            !isHost
                                        }
                                    >
                                        {
                                            item
                                        }
                                    </button>
                                )
                            )}
                        </div>
                    </section>

                    <section
                        className={
                            styles.card
                        }
                    >
                        <h2>
                            Chat
                        </h2>

                        <div
                            className={
                                styles.chatBox
                            }
                        >
                            {messages.length ===
                            0 ? (
                                <p
                                    className={
                                        styles.empty
                                    }
                                >
                                    No messages yet
                                </p>
                            ) : (
                                messages.map(
                                    (
                                        message,
                                        index
                                    ) => (
                                        <div
                                            key={
                                                index
                                            }
                                            className={
                                                styles.message
                                            }
                                        >
                                            <strong>
                                                {
                                                    message.username
                                                }
                                            </strong>

                                            <span>
                                                {
                                                    message.message
                                                }
                                            </span>
                                        </div>
                                    )
                                )
                            )}
                        </div>

                        <div
                            className={
                                styles.inputRow
                            }
                        >
                            <input
                                className={
                                    styles.input
                                }
                                value={
                                    messageInput
                                }
                                onChange={(
                                    e
                                ) =>
                                    setMessageInput(
                                        e.target
                                            .value
                                    )
                                }
                                onKeyDown={(
                                    e
                                ) => {
                                    if (
                                        e.key ===
                                        "Enter"
                                    ) {
                                        sendMessage();
                                    }
                                }}
                                placeholder="Type a message..."
                            />

                            <button
                                className={
                                    styles.button
                                }
                                onClick={
                                    sendMessage
                                }
                            >
                                Send
                            </button>
                        </div>

                        <div
                            className={
                                styles.reactions
                            }
                        >
                            {[
                                "❤️",
                                "😂",
                                "🔥",
                                "👏",
                                "😮",
                                "👍"
                            ].map(
                                (
                                    reaction
                                ) => (
                                    <button
                                        key={
                                            reaction
                                        }
                                        className={
                                            styles.reactionButton
                                        }
                                        onClick={() =>
                                            sendReaction(
                                                reaction
                                            )
                                        }
                                    >
                                        {
                                            reaction
                                        }
                                    </button>
                                )
                            )}
                        </div>

                        <div
                            className={
                                styles.floatingReactions
                            }
                        >
                            {reactions.map(
                                (
                                    reaction
                                ) => (
                                    <span
                                        key={
                                            reaction.id
                                        }
                                    >
                                        {
                                            reaction.reaction
                                        }
                                    </span>
                                )
                            )}
                        </div>
                    </section>
                </main>

                <aside
                    className={
                        styles.sidebar
                    }
                >
                    <section
                        className={
                            styles.card
                        }
                    >
                        <h2>
                            Participants
                        </h2>

                        <div
                            className={
                                styles.participants
                            }
                        >
                            {participants.map(
                                (
                                    participant
                                ) => (
                                    <div
                                        key={
                                            participant.userId ||
                                            participant.socketId
                                        }
                                        className={
                                            styles.participant
                                        }
                                    >
                                        <div
                                            className={
                                                styles.participantInfo
                                            }
                                        >
                                            <div
                                                className={
                                                    styles.avatar
                                                }
                                            >
                                                {(
                                                    participant.username ||
                                                    "U"
                                                )
                                                    .charAt(
                                                        0
                                                    )
                                                    .toUpperCase()}
                                            </div>

                                            <div>
                                                <div
                                                    className={
                                                        styles.username
                                                    }
                                                >
                                                    {
                                                        participant.username
                                                    }

                                                    {participant.userId ===
                                                        currentUserId && (
                                                        <span
                                                            className={
                                                                styles.you
                                                            }
                                                        >
                                                            You
                                                        </span>
                                                    )}
                                                </div>

                                                <span
                                                    className={`${styles.role} ${
                                                        participant.role ===
                                                        "Host"
                                                            ? styles.hostRole
                                                            : participant.role ===
                                                              "Moderator"
                                                            ? styles.moderatorRole
                                                            : styles.participantRole
                                                    }`}
                                                >
                                                    {
                                                        participant.role
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        {isHost &&
                                            participant.userId !==
                                                currentUserId && (
                                                <div
                                                    className={
                                                        styles.participantActions
                                                    }
                                                >
                                                    <select
                                                        className={
                                                            styles.roleSelect
                                                        }
                                                        value={
                                                            participant.role
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            assignRole(
                                                                participant.userId,
                                                                e
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                    >
                                                        <option value="Participant">
                                                            Participant
                                                        </option>

                                                        <option value="Moderator">
                                                            Moderator
                                                        </option>

                                                        <option value="Host">
                                                            Host
                                                        </option>
                                                    </select>

                                                    <button
                                                        className={
                                                            styles.removeButton
                                                        }
                                                        onClick={() =>
                                                            removeParticipant(
                                                                participant.userId
                                                            )
                                                        }
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            )}
                                    </div>
                                )
                            )}
                        </div>
                    </section>

                    <section
                        className={
                            styles.card
                        }
                    >
                        <h2>
                            Room Info
                        </h2>

                        <div
                            className={
                                styles.infoRow
                            }
                        >
                            <span>
                                Room
                            </span>

                            <strong>
                                {roomId ||
                                    "-"}
                            </strong>
                        </div>

                        <div
                            className={
                                styles.infoRow
                            }
                        >
                            <span>
                                Vibe
                            </span>

                            <strong>
                                {vibe}
                            </strong>
                        </div>

                        <div
                            className={
                                styles.infoRow
                            }
                        >
                            <span>
                                Status
                            </span>

                            <strong>
                                {playState ===
                                "playing"
                                    ? "Playing"
                                    : "Paused"}
                            </strong>
                        </div>
                    </section>
                </aside>
            </div>

            {!roomId && (
                <div
                    className={
                        styles.joinOverlay
                    }
                >
                    <div
                        className={
                            styles.joinCard
                        }
                    >
                        <h1>
                            Watch Party
                        </h1>

                        <input
                            className={
                                styles.input
                            }
                            value={
                                username
                            }
                            onChange={(
                                e
                            ) =>
                                setUsername(
                                    e.target
                                        .value
                                )
                            }
                            placeholder="Your name"
                        />

                        <input
                            className={
                                styles.input
                            }
                            value={
                                roomId
                            }
                            onChange={(
                                e
                            ) =>
                                setRoomId(
                                    e.target
                                        .value
                                )
                            }
                            placeholder="Room code"
                        />

                        <input
                            className={
                                styles.input
                            }
                            value={
                                roomName
                            }
                            onChange={(
                                e
                            ) =>
                                setRoomName(
                                    e.target
                                        .value
                                )
                            }
                            placeholder="Room name"
                        />

                        <input
                            className={
                                styles.input
                            }
                            value={
                                videoInput
                            }
                            onChange={(
                                e
                            ) =>
                                setVideoInput(
                                    e.target
                                        .value
                                )
                            }
                            placeholder="YouTube URL for new room"
                        />

                        <div
                            className={
                                styles.joinButtons
                            }
                        >
                            <button
                                className={`${styles.button} ${styles.primaryButton}`}
                                onClick={
                                    createRoom
                                }
                            >
                                Create Room
                            </button>

                            <button
                                className={`${styles.button} ${styles.secondaryButton}`}
                                onClick={
                                    joinRoom
                                }
                            >
                                Join Room
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WatchParty;