import { useEffect, useRef, useState } from "react";
import {
    useLocation,
    useNavigate,
    useParams
} from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";
import styles from "../styles/WatchParty.module.css";

const WatchParty = () => {
    const { roomId } = useParams();
    const location = useLocation();
    const { user, token } = useAuth();
    const navigate = useNavigate();

    const guestUsername =
        location.state?.username ||
        sessionStorage.getItem("guestUsername") ||
        "Guest";

    const guestId =
        location.state?.guestId ||
        sessionStorage.getItem("guestId") ||
        "";

    const createRoom =
        location.state?.createRoom || false;

    const initialVideoId =
        location.state?.videoId || "";

    const initialRoomName =
        location.state?.roomName || "";

    const currentUserId =
        user?.id || guestId;

    const currentUsername =
        user?.username || guestUsername;

    const socketRef = useRef(null);
    const playerRef = useRef(null);
    const playerContainerRef =
        useRef(null);
    const syncingRef = useRef(false);
    const lastTimeRef = useRef(0);
    const roleRef = useRef("");

    const [roomVibe, setRoomVibe] =
        useState("Normal");

    const [showMoodPopup, setShowMoodPopup] =
        useState(true);

    const [showSidebar, setShowSidebar] =
        useState(true);

    const [fullView, setFullView] =
        useState(false);

    const [sidebarTab, setSidebarTab] =
        useState("chat");

    const [role, setRole] =
        useState("");

    const [participants, setParticipants] =
        useState([]);

    const [videoId, setVideoId] =
        useState(initialVideoId);

    const [videoInput, setVideoInput] =
        useState("");

    const [queue, setQueue] =
        useState([]);

    const [queueVideoInput, setQueueVideoInput] =
        useState("");

    const [messages, setMessages] =
        useState([]);

    const [message, setMessage] =
        useState("");

    const [reactions, setReactions] =
        useState([]);

    const [error, setError] =
        useState("");

    const [roomName, setRoomName] =
        useState(initialRoomName);

    const vibes = [
        "Normal",
        "Movie Night",
        "Late Night",
        "Party",
        "Romantic",
        "Chill",
        "Workplace"
    ];

    const canControl =
        role === "Host" ||
        role === "Moderator";

    const isHost =
        role === "Host";

    useEffect(() => {
        if (guestUsername) {
            sessionStorage.setItem(
                "guestUsername",
                guestUsername
            );
        }
    }, [guestUsername]);

    useEffect(() => {
        const socket = io(
            "http://localhost:8080",
            {
                auth: {
                    token: token || null,
                    guestId: user
                        ? null
                        : guestId,
                    guestName: user
                        ? null
                        : currentUsername
                }
            }
        );

        socketRef.current = socket;

        socket.on("connect", () => {
            socket.emit(
                "join_room",
                {
                    roomId,
                    username:
                        currentUsername,
                    createRoom:
                        createRoom,
                    videoId:
                        initialVideoId,
                    roomName:
                        initialRoomName
                }
            );
        });

        socket.on(
            "user_joined",
            (data) => {
                if (
                    Array.isArray(
                        data.participants
                    )
                ) {
                    setParticipants(
                        data.participants
                    );
                }

                if (
                    data.roomName
                ) {
                    setRoomName(
                        data.roomName
                    );
                }

                if (
                    data.userId ===
                    currentUserId
                ) {
                    const newRole =
                        data.role || "";

                    setRole(
                        newRole
                    );

                    roleRef.current =
                        newRole;
                }
            }
        );

        socket.on(
            "user_left",
            (data) => {
                if (
                    Array.isArray(
                        data.participants
                    )
                ) {
                    setParticipants(
                        data.participants
                    );
                }
            }
        );

        socket.on(
            "role_assigned",
            (data) => {
                /*
                 * Backend can send the complete participant
                 * list or only the changed user's role.
                 * Handle both cases.
                 */
                if (
                    Array.isArray(
                        data.participants
                    )
                ) {
                    setParticipants(
                        data.participants
                    );
                } else if (
                    data.userId
                ) {
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
                    currentUserId
                ) {
                    const newRole =
                        data.role || "Participant";

                    setRole(
                        newRole
                    );

                    roleRef.current =
                        newRole;
                }
            }
        );

        socket.on(
            "participant_removed",
            (data) => {
                if (
                    data.userId ===
                    currentUserId
                ) {
                    navigate("/");
                    return;
                }

                if (
                    Array.isArray(
                        data.participants
                    )
                ) {
                    setParticipants(
                        data.participants
                    );
                } else {
                    setParticipants(
                        (prev) =>
                            prev.filter(
                                (participant) =>
                                    participant.userId !==
                                    data.userId
                            )
                    );
                }
            }
        );

        socket.on(
            "sync_state",
            (data) => {
                setVideoId(
                    data.videoId || ""
                );

                setQueue(
                    data.queue || []
                );

                setRoomVibe(
                    data.vibe || "Normal"
                );

                if (
                    data.roomName
                ) {
                    setRoomName(
                        data.roomName
                    );
                }

                if (
                    data.vibe ===
                    "Normal"
                ) {
                    setShowMoodPopup(
                        true
                    );
                } else {
                    setShowMoodPopup(
                        false
                    );
                }

                if (
                    playerRef.current &&
                    data.videoId
                ) {
                    playerRef.current.loadVideoById(
                        data.videoId
                    );

                    if (
                        typeof data.currentTime ===
                        "number"
                    ) {
                        playerRef.current.seekTo(
                            data.currentTime,
                            true
                        );
                    }

                    if (
                        data.playState ===
                        "playing"
                    ) {
                        playerRef.current.playVideo();
                    } else {
                        playerRef.current.pauseVideo();
                    }
                }
            }
        );

        socket.on(
            "play",
            () => {
                if (
                    playerRef.current
                ) {
                    syncingRef.current =
                        true;

                    playerRef.current.playVideo();

                    setTimeout(() => {
                        syncingRef.current =
                            false;
                    }, 500);
                }
            }
        );

        socket.on(
            "pause",
            () => {
                if (
                    playerRef.current
                ) {
                    syncingRef.current =
                        true;

                    playerRef.current.pauseVideo();

                    setTimeout(() => {
                        syncingRef.current =
                            false;
                    }, 500);
                }
            }
        );

        socket.on(
            "seek",
            (data) => {
                if (
                    playerRef.current
                ) {
                    syncingRef.current =
                        true;

                    lastTimeRef.current =
                        data.time;

                    playerRef.current.seekTo(
                        data.time,
                        true
                    );

                    setTimeout(() => {
                        syncingRef.current =
                            false;
                    }, 500);
                }
            }
        );

        socket.on(
            "change_video",
            (data) => {
                setVideoId(
                    data.videoId
                );

                if (
                    playerRef.current
                ) {
                    playerRef.current.loadVideoById(
                        data.videoId
                    );
                }
            }
        );

        socket.on(
            "queue_updated",
            (data) => {
                setQueue(
                    data.queue || []
                );
            }
        );

        socket.on(
            "room_vibe_changed",
            (data) => {
                setRoomVibe(
                    data.vibe
                );

                setShowMoodPopup(
                    data.vibe ===
                    "Normal"
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
                const reaction = {
                    ...data,
                    id:
                        data.id ||
                        `${Date.now()}-${Math.random()}`
                };

                setReactions(
                    (prev) => [
                        ...prev,
                        reaction
                    ]
                );

                setTimeout(() => {
                    setReactions(
                        (prev) =>
                            prev.filter(
                                (item) =>
                                    item.id !==
                                    reaction.id
                            )
                    );
                }, 2500);
            }
        );

        socket.on(
            "room_error",
            (data) => {
                setError(
                    data.message
                );
            }
        );

        socket.on(
            "connect_error",
            (socketError) => {
                setError(
                    socketError.message ||
                    "Unable to connect to room"
                );
            }
        );

        return () => {
            socket.disconnect();
        };
    }, [
        roomId,
        token,
        guestId,
        currentUsername,
        currentUserId,
        createRoom,
        initialVideoId,
        initialRoomName,
        user,
        navigate
    ]);

    useEffect(() => {
        const createPlayer = () => {
            if (
                playerRef.current ||
                !playerContainerRef.current ||
                !videoId
            ) {
                return;
            }

            playerRef.current =
                new window.YT.Player(
                    playerContainerRef.current,
                    {
                        width: "100%",
                        height: "100%",
                        videoId:
                            videoId,

                        playerVars: {
                            autoplay: 0,
                            controls: 1,
                            rel: 0,
                            origin:
                                window.location.origin
                        },

                        events: {
                            onError:
                                (event) => {
                                    console.log(
                                        "YouTube error code:",
                                        event.data
                                    );
                                },

                            onStateChange:
                                (event) => {
                                    if (
                                        event.data ===
                                        window.YT
                                            .PlayerState
                                            .ENDED
                                    ) {
                                        if (
                                            socketRef.current
                                        ) {
                                            socketRef.current.emit(
                                                "video_ended"
                                            );
                                        }

                                        return;
                                    }

                                    if (
                                        syncingRef.current
                                    ) {
                                        return;
                                    }

                                    const currentRole =
                                        roleRef.current;

                                    if (
                                        currentRole !==
                                        "Host" &&
                                        currentRole !==
                                        "Moderator"
                                    ) {
                                        return;
                                    }

                                    if (
                                        event.data ===
                                        window.YT
                                            .PlayerState
                                            .PLAYING
                                    ) {
                                        socketRef.current.emit(
                                            "play"
                                        );
                                    }

                                    if (
                                        event.data ===
                                        window.YT
                                            .PlayerState
                                            .PAUSED
                                    ) {
                                        socketRef.current.emit(
                                            "pause"
                                        );
                                    }
                                }
                        }
                    }
                );
        };

        if (
            window.YT &&
            window.YT.Player
        ) {
            createPlayer();
            return;
        }

        const script =
            document.createElement(
                "script"
            );

        script.src =
            "https://www.youtube.com/iframe_api";

        document.body.appendChild(
            script
        );

        window.onYouTubeIframeAPIReady =
            createPlayer;
    }, [videoId]);

    useEffect(() => {
        const interval =
            setInterval(() => {
                if (
                    !playerRef.current ||
                    !canControl ||
                    syncingRef.current
                ) {
                    return;
                }

                const currentTime =
                    playerRef.current.getCurrentTime();

                const difference =
                    Math.abs(
                        currentTime -
                        lastTimeRef.current
                    );

                if (
                    difference > 1.5 &&
                    socketRef.current
                ) {
                    socketRef.current.emit(
                        "seek",
                        {
                            time:
                                currentTime
                        }
                    );
                }

                lastTimeRef.current =
                    currentTime;
            }, 500);

        return () => {
            clearInterval(
                interval
            );
        };
    }, [canControl]);

    const getVideoId = (
        input
    ) => {
        let value =
            input.trim();

        if (!value) {
            return "";
        }

        try {
            if (
                value.includes(
                    "youtube.com"
                ) ||
                value.includes(
                    "youtu.be"
                )
            ) {
                const url =
                    new URL(value);

                if (
                    url.hostname.includes(
                        "youtu.be"
                    )
                ) {
                    return url.pathname
                        .replace(
                            "/",
                            ""
                        )
                        .split(
                            "/"
                        )[0];
                }

                return (
                    url.searchParams.get(
                        "v"
                    ) || ""
                );
            }
        } catch (
            error
        ) {
            console.log(
                "Invalid YouTube URL"
            );
        }

        return value;
    };

    const handlePlay = () => {
        if (!canControl)
            return;

        socketRef.current.emit(
            "play"
        );
    };

    const handlePause = () => {
        if (!canControl)
            return;

        socketRef.current.emit(
            "pause"
        );
    };

    const handleSeek = () => {
        if (
            !canControl ||
            !playerRef.current
        ) {
            return;
        }

        const time =
            playerRef.current.getCurrentTime();

        socketRef.current.emit(
            "seek",
            {
                time
            }
        );
    };

    const handleChangeVideo =
        () => {
            if (
                !isHost ||
                !videoInput.trim()
            ) {
                return;
            }

            const id =
                getVideoId(
                    videoInput
                );

            if (!id) return;

            socketRef.current.emit(
                "change_video",
                {
                    videoId: id
                }
            );

            setVideoInput("");
        };

    const handleAddToQueue =
        () => {
            if (
                !canControl ||
                !queueVideoInput.trim()
            ) {
                return;
            }

            const id =
                getVideoId(
                    queueVideoInput
                );

            if (!id) return;

            socketRef.current.emit(
                "add_to_queue",
                {
                    videoId: id
                }
            );

            setQueueVideoInput("");
        };

    const handleRemoveFromQueue =
        (index) => {
            if (!canControl)
                return;

            socketRef.current.emit(
                "remove_from_queue",
                {
                    index
                }
            );
        };

    const handleChangeVibe =
        (vibe) => {
            if (!isHost)
                return;

            setRoomVibe(vibe);
            setShowMoodPopup(
                false
            );

            socketRef.current.emit(
                "change_vibe",
                {
                    vibe
                }
            );
        };

    const handleAssignRole =
        (
            userId,
            newRole
        ) => {
            if (!isHost)
                return;

            socketRef.current.emit(
                "assign_role",
                {
                    userId,
                    role: newRole
                }
            );
        };

    const handleRemove = (
        userId
    ) => {
        if (!isHost)
            return;

        socketRef.current.emit(
            "remove_participant",
            {
                userId
            }
        );
    };

    const handleSendMessage =
        (e) => {
            e.preventDefault();

            if (!message.trim())
                return;

            socketRef.current.emit(
                "send_message",
                {
                    message:
                        message.trim()
                }
            );

            setMessage("");
        };

    const sendReaction = (
        emoji
    ) => {
        if (
            !socketRef.current
        ) {
            return;
        }

        socketRef.current.emit(
            "reaction",
            {
                reaction:
                    emoji
            }
        );
    };

    const handleLeaveRoom =
        () => {
            if (
                socketRef.current
            ) {
                socketRef.current.emit(
                    "leave_room"
                );

                socketRef.current.disconnect();

                socketRef.current =
                    null;
            }

            navigate("/");
        };

    const getVibeClass = () => {
        if (
            roomVibe ===
            "Movie Night"
        ) {
            return styles.movieNight;
        }

        if (
            roomVibe ===
            "Late Night"
        ) {
            return styles.lateNight;
        }

        if (
            roomVibe ===
            "Party"
        ) {
            return styles.party;
        }

        if (
            roomVibe ===
            "Romantic"
        ) {
            return styles.romantic;
        }

        if (
            roomVibe ===
            "Chill"
        ) {
            return styles.chill;
        }

        if (
            roomVibe ===
            "Workplace"
        ) {
            return styles.workplace;
        }

        return styles.normal;
    };

    return (
        <div
            className={`${styles.page} ${
                getVibeClass()
            } ${
                !showSidebar
                    ? styles.sidebarClosed
                    : ""
            } ${
                fullView
                    ? styles.fullView
                    : ""
            }`}
        >
            <div
                className={
                    styles.container
                }
            >
                <div
                    className={
                        styles.header
                    }
                >
                    <div
                        className={
                            styles.logo
                        }
                    >
                        <span
                            className={
                                styles.logoIcon
                            }
                        >
                            ⚡
                        </span>

                        Watch Party
                    </div>

                    <div
                        className={
                            styles.roomInfo
                        }
                    >
                        <span>
                            {roomName ||
                                "Watch Room"}
                        </span>

                        <span
                            className={
                                styles.roomId
                            }
                        >
                            Code: {roomId}
                        </span>

                        <span
                            className={
                                styles.youAre
                            }
                        >
                            You are:
                            <strong>
                                {" "}
                                {role ||
                                    "Connecting..."}
                            </strong>
                        </span>
                    </div>
                </div>

                {error && (
                    <div
                        className={
                            styles.error
                        }
                    >
                        {error}
                    </div>
                )}

                <div
                    className={
                        styles.vibeBar
                    }
                >
                    <div
                        className={
                            styles.vibeTitle
                        }
                    >
                        <span>
                            Room vibe
                        </span>

                        <span
                            className={
                                styles.selectedVibe
                            }
                        >
                            {roomVibe ===
                            "Normal"
                                ? "Choose mood"
                                : roomVibe}
                        </span>
                    </div>

                    {isHost && (
                        <div
                            className={
                                styles.vibeOptions
                            }
                        >
                            {vibes.map(
                                (vibe) => (
                                    <button
                                        key={
                                            vibe
                                        }
                                        className={
                                            roomVibe ===
                                            vibe
                                                ? `${styles.vibeButton} ${styles.activeVibe}`
                                                : styles.vibeButton
                                        }
                                        onClick={() =>
                                            handleChangeVibe(
                                                vibe
                                            )
                                        }
                                    >
                                        {
                                            vibe
                                        }
                                    </button>
                                )
                            )}
                        </div>
                    )}

                    {showMoodPopup &&
                        isHost && (
                            <div
                                className={
                                    styles.moodPopup
                                }
                            >
                                <button
                                    className={
                                        styles.popupClose
                                    }
                                    onClick={() =>
                                        setShowMoodPopup(
                                            false
                                        )
                                    }
                                >
                                    ×
                                </button>

                                <strong>
                                    Choose your mood
                                </strong>

                                <p>
                                    From here you can choose the mood you like for your watch party.
                                </p>
                            </div>
                        )}
                </div>

                {fullView && (
                    <button
                        className={
                            styles.exitFullView
                        }
                        onClick={() =>
                            setFullView(
                                false
                            )
                        }
                    >
                        ✕ Exit Full View
                    </button>
                )}

                <div
                    className={
                        styles.main
                    }
                >
                    <div
                        className={
                            styles.videoSection
                        }
                    >
                        <div
                            className={
                                styles.videoCard
                            }
                        >
                            <div
                                className={
                                    styles.fullViewVideoWrapper
                                }
                            >
                                <div
                                    ref={
                                        playerContainerRef
                                    }
                                    className={
                                        styles.video
                                    }
                                />

                                {reactions.length >
                                    0 && (
                                    <div
                                        className={
                                            styles.videoReactions
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
                                )}
                            </div>

                            <div
                                className={
                                    styles.controls
                                }
                            >
                                <button
                                    className={`${styles.button} ${styles.primaryButton} ${
                                        !canControl
                                            ? styles.disabledButton
                                            : ""
                                    }`}
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
                                    className={`${styles.button} ${
                                        !canControl
                                            ? styles.disabledButton
                                            : ""
                                    }`}
                                    onClick={
                                        handlePause
                                    }
                                    disabled={
                                        !canControl
                                    }
                                >
                                    ❚❚ Pause
                                </button>

                                <button
                                    className={`${styles.button} ${
                                        !canControl
                                            ? styles.disabledButton
                                            : ""
                                    }`}
                                    onClick={
                                        handleSeek
                                    }
                                    disabled={
                                        !canControl
                                    }
                                >
                                    ⟳ Sync Position
                                </button>

                                <button
                                    className={
                                        styles.button
                                    }
                                    onClick={() =>
                                        setFullView(
                                            true
                                        )
                                    }
                                >
                                    ⛶ See in Full View
                                </button>
                            </div>

                            {isHost && (
                                <div
                                    className={
                                        styles.changeVideo
                                    }
                                >
                                    <input
                                        type="text"
                                        className={
                                            styles.input
                                        }
                                        placeholder="Paste YouTube URL or video ID"
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
                                    />

                                    <button
                                        className={`${styles.button} ${styles.primaryButton}`}
                                        onClick={
                                            handleChangeVideo
                                        }
                                    >
                                        Change Video
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {showSidebar ? (
                        <div
                            className={
                                styles.sidebar
                            }
                        >
                            <div
                                className={
                                    styles.sidebarHeader
                                }
                            >
                                <h2>
                                    Room
                                </h2>

                                <button
                                    className={
                                        styles.closeSidebar
                                    }
                                    onClick={() =>
                                        setShowSidebar(
                                            false
                                        )
                                    }
                                >
                                    ×
                                </button>
                            </div>

                            <div
                                className={
                                    styles.sidebarTabs
                                }
                            >
                                <button
                                    className={
                                        sidebarTab ===
                                        "chat"
                                            ? `${styles.sidebarTab} ${styles.activeTab}`
                                            : styles.sidebarTab
                                    }
                                    onClick={() =>
                                        setSidebarTab(
                                            "chat"
                                        )
                                    }
                                >
                                    Chat
                                </button>

                                <button
                                    className={
                                        sidebarTab ===
                                        "people"
                                            ? `${styles.sidebarTab} ${styles.activeTab}`
                                            : styles.sidebarTab
                                    }
                                    onClick={() =>
                                        setSidebarTab(
                                            "people"
                                        )
                                    }
                                >
                                    People
                                </button>

                                <button
                                    className={
                                        sidebarTab ===
                                        "queue"
                                            ? `${styles.sidebarTab} ${styles.activeTab}`
                                            : styles.sidebarTab
                                    }
                                    onClick={() =>
                                        setSidebarTab(
                                            "queue"
                                        )
                                    }
                                >
                                    Queue
                                </button>
                            </div>

                            {sidebarTab ===
                                "chat" && (
                                <div
                                    className={
                                        styles.tabContent
                                    }
                                >
                                    <div
                                        className={
                                            styles.chat
                                        }
                                    >
                                        {messages.length ===
                                        0 ? (
                                            <div
                                                className={
                                                    styles.emptyChat
                                                }
                                            >
                                                <div>
                                                    ◎
                                                </div>

                                                <strong>
                                                    No messages yet
                                                </strong>

                                                <span>
                                                    Be the first to say something!
                                                </span>
                                            </div>
                                        ) : (
                                            messages.map(
                                                (
                                                    item,
                                                    index
                                                ) => (
                                                    <p
                                                        className={
                                                            styles.message
                                                        }
                                                        key={
                                                            index
                                                        }
                                                    >
                                                        <strong>
                                                            {
                                                                item.username
                                                            }
                                                            :
                                                        </strong>{" "}
                                                        {
                                                            item.message
                                                        }
                                                    </p>
                                                )
                                            )
                                        )}
                                    </div>

                                    <form
                                        className={
                                            styles.chatForm
                                        }
                                        onSubmit={
                                            handleSendMessage
                                        }
                                    >
                                        <input
                                            type="text"
                                            className={
                                                styles.chatInput
                                            }
                                            placeholder="Type a message..."
                                            value={
                                                message
                                            }
                                            onChange={(
                                                e
                                            ) =>
                                                setMessage(
                                                    e.target
                                                        .value
                                                )
                                            }
                                        />

                                        <button
                                            type="submit"
                                            className={
                                                styles.sendButton
                                            }
                                        >
                                            Send
                                        </button>
                                    </form>

                                    <div
                                        className={
                                            styles.reactionSection
                                        }
                                    >
                                        <h3
                                            className={
                                                styles.sectionTitle
                                            }
                                        >
                                            Reactions
                                        </h3>

                                        <div
                                            className={
                                                styles.reactions
                                            }
                                        >
                                            {[
                                                "❤️",
                                                "😂",
                                                "🔥",
                                                "👏"
                                            ].map(
                                                (
                                                    emoji
                                                ) => (
                                                    <button
                                                        key={
                                                            emoji
                                                        }
                                                        className={
                                                            styles.reactionButton
                                                        }
                                                        onClick={() =>
                                                            sendReaction(
                                                                emoji
                                                            )
                                                        }
                                                    >
                                                        {
                                                            emoji
                                                        }
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        className={
                                            styles.leaveButton
                                        }
                                        onClick={
                                            handleLeaveRoom
                                        }
                                    >
                                        Leave Room
                                    </button>
                                </div>
                            )}

                            {sidebarTab ===
                                "people" && (
                                <div
                                    className={
                                        styles.tabContent
                                    }
                                >
                                    <h3
                                        className={
                                            styles.sectionTitle
                                        }
                                    >
                                        <span>
                                            Participants
                                        </span>

                                        <span
                                            className={
                                                styles.count
                                            }
                                        >
                                            {
                                                participants.length
                                            }
                                        </span>
                                    </h3>

                                    {participants.map(
                                        (
                                            participant
                                        ) => (
                                            <div
                                                className={
                                                    styles.participant
                                                }
                                                key={
                                                    participant.socketId
                                                }
                                            >
                                                <div>
                                                    <div
                                                        className={
                                                            styles.participantName
                                                        }
                                                    >
                                                        {
                                                            participant.username
                                                        }
                                                    </div>

                                                    {participant.role ===
                                                        "Host" && (
                                                        <span
                                                            className={
                                                                styles.role
                                                            }
                                                        >
                                                            Host
                                                        </span>
                                                    )}

                                                    {participant.role ===
                                                        "Moderator" && (
                                                        <span
                                                            className={
                                                                styles.role
                                                            }
                                                        >
                                                            Moderator
                                                        </span>
                                                    )}

                                                    {isHost &&
                                                        participant.userId !==
                                                        currentUserId && (
                                                            <div
                                                                className={
                                                                    styles.participantActions
                                                                }
                                                            >
                                                                <button
                                                                    className={
                                                                        styles.smallButton
                                                                    }
                                                                    onClick={() =>
                                                                        handleAssignRole(
                                                                            participant.userId,
                                                                            "Moderator"
                                                                        )
                                                                    }
                                                                >
                                                                    Moderator
                                                                </button>

                                                                <button
                                                                    className={
                                                                        styles.smallButton
                                                                    }
                                                                    onClick={() =>
                                                                        handleAssignRole(
                                                                            participant.userId,
                                                                            "Participant"
                                                                        )
                                                                    }
                                                                >
                                                                    Participant
                                                                </button>

                                                                <button
                                                                    className={
                                                                        styles.smallButton
                                                                    }
                                                                    onClick={() =>
                                                                        handleAssignRole(
                                                                            participant.userId,
                                                                            "Host"
                                                                        )
                                                                    }
                                                                >
                                                                    Transfer Host
                                                                </button>

                                                                <button
                                                                    className={
                                                                        styles.smallButton
                                                                    }
                                                                    onClick={() =>
                                                                        handleRemove(
                                                                            participant.userId
                                                                        )
                                                                    }
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        )}
                                                </div>
                                            </div>
                                        )
                                    )}

                                    <button
                                        className={
                                            styles.leaveButton
                                        }
                                        onClick={
                                            handleLeaveRoom
                                        }
                                    >
                                        Leave Room
                                    </button>
                                </div>
                            )}

                            {sidebarTab ===
                                "queue" && (
                                <div
                                    className={
                                        styles.tabContent
                                    }
                                >
                                    <h3
                                        className={
                                            styles.sectionTitle
                                        }
                                    >
                                        Queue
                                    </h3>

                                    {canControl && (
                                        <div
                                            className={
                                                styles.queueInput
                                            }
                                        >
                                            <input
                                                type="text"
                                                className={
                                                    styles.chatInput
                                                }
                                                placeholder="YouTube URL or video ID"
                                                value={
                                                    queueVideoInput
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    setQueueVideoInput(
                                                        e.target
                                                            .value
                                                    )
                                                }
                                            />

                                            <button
                                                className={
                                                    styles.sendButton
                                                }
                                                onClick={
                                                    handleAddToQueue
                                                }
                                            >
                                                Add
                                            </button>
                                        </div>
                                    )}

                                    {queue.length ===
                                    0 ? (
                                        <div
                                            className={
                                                styles.emptyQueue
                                            }
                                        >
                                            No videos in queue
                                        </div>
                                    ) : (
                                        <div
                                            className={
                                                styles.queueList
                                            }
                                        >
                                            {queue.map(
                                                (
                                                    queuedVideo,
                                                    index
                                                ) => (
                                                    <div
                                                        className={
                                                            styles.queueItem
                                                        }
                                                        key={`${queuedVideo}-${index}`}
                                                    >
                                                        <div
                                                            className={
                                                                styles.queueInfo
                                                            }
                                                        >
                                                            <span
                                                                className={
                                                                    styles.queueNumber
                                                                }
                                                            >
                                                                {index +
                                                                    1}
                                                            </span>

                                                            <span
                                                                className={
                                                                    styles.queueVideo
                                                                }
                                                            >
                                                                {
                                                                    queuedVideo
                                                                }
                                                            </span>
                                                        </div>

                                                        {canControl && (
                                                            <button
                                                                className={
                                                                    styles.queueRemove
                                                                }
                                                                onClick={() =>
                                                                    handleRemoveFromQueue(
                                                                        index
                                                                    )
                                                                }
                                                            >
                                                                ×
                                                            </button>
                                                        )}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}

                                    <button
                                        className={
                                            styles.leaveButton
                                        }
                                        onClick={
                                            handleLeaveRoom
                                        }
                                    >
                                        Leave Room
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            className={
                                styles.openSidebar
                            }
                            onClick={() =>
                                setShowSidebar(
                                    true
                                )
                            }
                        >
                            Room
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WatchParty;