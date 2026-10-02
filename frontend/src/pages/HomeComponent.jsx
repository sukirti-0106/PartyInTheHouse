import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useRoom } from "../contexts/RoomContext";
import styles from "../styles/Pages.module.css";

const HomeComponent = () => {
    const { user, logout } = useAuth();
    const { rooms, getRooms, joinRoom } = useRoom();

    const [roomId, setRoomId] = useState("");
    const [message, setMessage] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        getRooms();
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/authentication");
    };

    const handleJoin = async () => {
        if (!roomId.trim()) {
            setMessage("Please enter a room code");
            return;
        }

        try {
            setMessage("");

            const room = await joinRoom(roomId.trim());

            navigate(`/room/${room.roomId}`);
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Unable to join room"
            );
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>

                <div className={styles.header}>
                    <div className={styles.logo}>
                        WATCH PARTY
                    </div>

                    <div className={styles.topActions}>
                        <button
                            className={styles.secondaryButton}
                            onClick={() => navigate("/history")}
                        >
                            Room History
                        </button>

                        <button
                            className={styles.logout}
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>
                </div>

                <div className={styles.welcome}>
                    <h2>
                        Welcome, {user?.username}
                    </h2>

                    <p>
                        Create or join a watch party with your friends.
                    </p>
                </div>

                <div className={styles.createSection}>
                    <button
                        className={styles.primaryButton}
                        onClick={() => navigate("/create-room")}
                    >
                        Create Room
                    </button>
                </div>

                <div className={styles.joinBox}>
                    <h3>Join a Room</h3>

                    <div className={styles.joinForm}>
                        <input
                            className={styles.input}
                            type="text"
                            placeholder="Enter room code"
                            value={roomId}
                            onChange={(e) =>
                                setRoomId(e.target.value)
                            }
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleJoin();
                                }
                            }}
                        />

                        <button
                            className={styles.primaryButton}
                            onClick={handleJoin}
                        >
                            Join Room
                        </button>
                    </div>

                    {message && (
                        <p className={styles.message}>
                            {message}
                        </p>
                    )}
                </div>

                <div className={styles.roomSection}>
                    <h2>Your Rooms</h2>

                    {rooms.length === 0 ? (
                        <div className={styles.empty}>
                            <p>No active rooms</p>
                            <p>
                                Create a room to start your first watch party.
                            </p>
                        </div>
                    ) : (
                        <div className={styles.roomGrid}>
                            {rooms.map((room) => (
                                <div
                                    className={styles.roomCard}
                                    key={room._id}
                                >
                                    <h3>{room.name}</h3>

                                    <p>
                                        Room Code: {room.roomId}
                                    </p>

                                    <button
                                        className={styles.primaryButton}
                                        onClick={() =>
                                            navigate(
                                                `/room/${room.roomId}`
                                            )
                                        }
                                    >
                                        Open Room
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default HomeComponent;