import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRoom } from "../contexts/RoomContext";
import styles from "../styles/Pages.module.css";

const JoinRoom = () => {
    const [roomId, setRoomId] = useState("");
    const [message, setMessage] = useState("");

    const { joinRoom } = useRoom();
    const navigate = useNavigate();

    const handleJoin = async (e) => {
        e.preventDefault();

        try {
            const room = await joinRoom(roomId);

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
        <div className={styles.formContainer}>
            <h1>Join Watch Party</h1>

            <form onSubmit={handleJoin}>
                <input
                    className={styles.input}
                    type="text"
                    placeholder="Enter room code"
                    value={roomId}
                    onChange={(e) =>
                        setRoomId(e.target.value)
                    }
                />

                <button
                    className={styles.primaryButton}
                    type="submit"
                >
                    Join Room
                </button>
            </form>

            {message && (
                <p className={styles.message}>{message}</p>
            )}

            <button
                className={styles.secondaryButton}
                onClick={() => navigate("/home")}
            >
                Back
            </button>
        </div>
    </div>
);
};

export default JoinRoom;