import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import styles from "../styles/Authentication.module.css";

const backgrounds = [
    "/movie-night.jpg",
    "/party.jpg",
    "/romantic.jpg",
    "/chill.jpg",
    "/office.jpg",
    "/night-sky.jpg"
];

const Authentication = () => {
    const [showAuth, setShowAuth] = useState(false);
    const [isLogin, setIsLogin] = useState(true);

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [createVideoLink, setCreateVideoLink] = useState("");
    const [createRoomName, setCreateRoomName] = useState("");
    const [createName, setCreateName] = useState("");

    const [joinRoomCode, setJoinRoomCode] = useState("");
    const [joinName, setJoinName] = useState("");

    const [message, setMessage] = useState("");
    const [backgroundIndex, setBackgroundIndex] = useState(0);

    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(() => {
            setBackgroundIndex((prev) => {
                return (prev + 1) % backgrounds.length;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        try {
            if (isLogin) {
                const response = await axios.post(
                    "https://partyinthehouse.onrender.com/api/users/login",
                    {
                        email,
                        password
                    }
                );

                login(response.data);
                navigate("/home");
            } else {
                await axios.post(
                   "https://partyinthehouse.onrender.com/api/users/register",
                    {
                        username,
                        email,
                        password
                    }
                );

                setMessage(
                    "Registration successful. Please login."
                );

                setIsLogin(true);
                setUsername("");
                setPassword("");
            }
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Something went wrong"
            );
        }
    };

    const handleModeChange = () => {
        setIsLogin(!isLogin);
        setMessage("");
        setUsername("");
        setEmail("");
        setPassword("");
    };

    const getVideoId = (input) => {
        let value = input.trim();

        if (!value) {
            return "";
        }

        try {
            if (
                value.includes("youtube.com") ||
                value.includes("youtu.be")
            ) {
                const url = new URL(value);

                if (url.hostname.includes("youtu.be")) {
                    return url.pathname
                        .replace("/", "")
                        .split("/")[0];
                }

                return (
                    url.searchParams.get("v") || ""
                );
            }
        } catch (error) {
            console.log(
                "Invalid YouTube URL"
            );
        }

        return value;
    };

    const getGuestId = () => {
        let guestId =
            sessionStorage.getItem(
                "guestId"
            );

        if (!guestId) {
            guestId =
                "guest-" +
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .substring(2, 9);

            sessionStorage.setItem(
                "guestId",
                guestId
            );
        }

        return guestId;
    };

    const generateRoomCode = () => {
        return (
            Math.random()
                .toString(36)
                .substring(2, 7)
                .toUpperCase()
        );
    };

    const handleCreateRoom = () => {
        if (
            !createVideoLink.trim() ||
            !createRoomName.trim() ||
            !createName.trim()
        ) {
            setMessage(
                "Please enter YouTube link, room name and your name"
            );
            return;
        }

        const videoId =
            getVideoId(createVideoLink);

        if (!videoId) {
            setMessage(
                "Please enter a valid YouTube link"
            );
            return;
        }

        const roomCode =
            generateRoomCode();

        const guestId =
            getGuestId();

        sessionStorage.setItem(
            "guestUsername",
            createName
        );

        navigate(
            `/watch/${roomCode}`,
            {
                state: {
                    username: createName,
                    guestId: guestId,
                    createRoom: true,
                    videoId: videoId,
                    roomName: createRoomName
                }
            }
        );
    };

    const handleJoinRoom = () => {
        if (
            !joinRoomCode.trim() ||
            !joinName.trim()
        ) {
            setMessage(
                "Please enter room code and your name"
            );
            return;
        }

        const roomCode =
            joinRoomCode
                .trim()
                .toUpperCase();

        const guestId =
            getGuestId();

        sessionStorage.setItem(
            "guestUsername",
            joinName
        );

        navigate(
            `/watch/${roomCode}`,
            {
                state: {
                    username: joinName,
                    guestId: guestId,
                    createRoom: false
                }
            }
        );
    };

    const openLogin = () => {
        setShowAuth(true);
        setIsLogin(true);
        setMessage("");
    };

    const openSignup = () => {
        setShowAuth(true);
        setIsLogin(false);
        setMessage("");
    };

    const closeAuth = () => {
        setShowAuth(false);
        setMessage("");
        setUsername("");
        setEmail("");
        setPassword("");
    };

    return (
        <div className={styles.authPage}>
            <div
                className={
                    styles.backgroundWrapper
                }
            >
                {backgrounds.map(
                    (background, index) => (
                        <div
                            key={background}
                            className={`${styles.background} ${
                                index ===
                                backgroundIndex
                                    ? styles.activeBackground
                                    : ""
                            }`}
                            style={{
                                backgroundImage:
                                    `url(${background})`
                            }}
                        />
                    )
                )}

                <div
                    className={
                        styles.overlay
                    }
                ></div>
            </div>

            <div
                className={styles.navbar}
            >
                <div
                    className={
                        styles.navLogo
                    }
                >
                    ⚡ Watch Party
                </div>

                <div
                    className={
                        styles.navButtons
                    }
                >
                    <button
                        onClick={openLogin}
                        className={
                            styles.navButton
                        }
                    >
                        Login
                    </button>

                    <button
                        onClick={openSignup}
                        className={
                            styles.navButton
                        }
                    >
                        Signup
                    </button>
                </div>
            </div>

            <div
                className={styles.content}
            >
                <div
                    className={styles.intro}
                >
                    <p
                        className={
                            styles.smallText
                        }
                    >
                        WELCOME TO
                    </p>

                    <h1>WATCH PARTY</h1>

                    <p
                        className={
                            styles.tagline
                        }
                    >
                        Binge watching starts here.
                    </p>

                    <p
                        className={
                            styles.description
                        }
                    >
                        Enjoy movie time with your family and friends.
                        <br />
                        Watch videos together, all in one place.
                    </p>

                    <div
                        className={
                            styles.featureText
                        }
                    >
                        <span>
                            Watch Together
                        </span>

                        <span>•</span>

                        <span>
                            Chat Together
                        </span>

                        <span>•</span>

                        <span>
                            Enjoy Together
                        </span>
                    </div>
                </div>

                {!showAuth ? (
                    <div
                        className={
                            styles.roomOptions
                        }
                    >
                        <div
                            className={
                                styles.roomCard
                            }
                        >
                            <h2>
                                Create a Room
                            </h2>

                            <p>
                                Start a watch party with your friends
                            </p>

                            <input
                                type="text"
                                placeholder="Paste YouTube video link"
                                value={
                                    createVideoLink
                                }
                                onChange={(e) =>
                                    setCreateVideoLink(
                                        e.target.value
                                    )
                                }
                            />

                            <input
                                type="text"
                                placeholder="Enter room name"
                                value={
                                    createRoomName
                                }
                                onChange={(e) =>
                                    setCreateRoomName(
                                        e.target.value
                                    )
                                }
                            />

                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={
                                    createName
                                }
                                onChange={(e) =>
                                    setCreateName(
                                        e.target.value
                                    )
                                }
                            />

                            <button
                                className={
                                    styles.submitButton
                                }
                                onClick={
                                    handleCreateRoom
                                }
                            >
                                Create Room
                            </button>
                        </div>

                        <div
                            className={
                                styles.roomCard
                            }
                        >
                            <h2>
                                Join a Room
                            </h2>

                            <p>
                                Join your friends and watch together
                            </p>

                            <input
                                type="text"
                                placeholder="Enter room code"
                                value={
                                    joinRoomCode
                                }
                                onChange={(e) =>
                                    setJoinRoomCode(
                                        e.target.value
                                    )
                                }
                            />

                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={
                                    joinName
                                }
                                onChange={(e) =>
                                    setJoinName(
                                        e.target.value
                                    )
                                }
                            />

                            <button
                                className={
                                    styles.submitButton
                                }
                                onClick={
                                    handleJoinRoom
                                }
                            >
                                Join Room
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        className={
                            styles.authCard
                        }
                    >
                        <button
                            className={
                                styles.closeButton
                            }
                            onClick={
                                closeAuth
                            }
                        >
                            ×
                        </button>

                        <div
                            className={
                                styles.cardHeader
                            }
                        >
                            <h2>
                                {isLogin
                                    ? "Welcome Back"
                                    : "Create Account"}
                            </h2>

                            <p>
                                {isLogin
                                    ? "Login to continue your watch party"
                                    : "Create your account and start watching together"}
                            </p>
                        </div>

                        <form
                            className={
                                styles.form
                            }
                            onSubmit={
                                handleSubmit
                            }
                        >
                            {!isLogin && (
                                <div
                                    className={
                                        styles.inputGroup
                                    }
                                >
                                    <label>
                                        Username
                                    </label>

                                    <input
                                        type="text"
                                        placeholder="Enter your username"
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
                                        required
                                    />
                                </div>
                            )}

                            <div
                                className={
                                    styles.inputGroup
                                }
                            >
                                <label>
                                    Email
                                </label>

                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={
                                        email
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setEmail(
                                            e.target
                                                .value
                                        )
                                    }
                                    required
                                />
                            </div>

                            <div
                                className={
                                    styles.inputGroup
                                }
                            >
                                <label>
                                    Password
                                </label>

                                <input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={
                                        password
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setPassword(
                                            e.target
                                                .value
                                        )
                                    }
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className={
                                    styles.submitButton
                                }
                            >
                                {isLogin
                                    ? "Login"
                                    : "Create Account"}
                            </button>
                        </form>

                        {message && (
                            <p
                                className={
                                    styles.message
                                }
                            >
                                {message}
                            </p>
                        )}

                        <div
                            className={
                                styles.switchText
                            }
                        >
                            {isLogin
                                ? "Don't have an account?"
                                : "Already have an account?"}

                            <button
                                type="button"
                                onClick={
                                    handleModeChange
                                }
                                className={
                                    styles.switchButton
                                }
                            >
                                {isLogin
                                    ? "Create a new account"
                                    : "Login here"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {message &&
                !showAuth && (
                    <p
                        className={
                            styles.message
                        }
                    >
                        {message}
                    </p>
                )}

            <div
                className={styles.dots}
            >
                {backgrounds.map(
                    (_, index) => (
                        <span
                            key={index}
                            className={
                                index ===
                                backgroundIndex
                                    ? styles.activeDot
                                    : ""
                            }
                        ></span>
                    )
                )}
            </div>
        </div>
    );
};

export default Authentication;