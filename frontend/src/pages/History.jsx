import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRoom } from "../contexts/RoomContext";
import styles from "../styles/Pages.module.css";

const History = () => {
    const { history, getHistory } = useRoom();
    const navigate = useNavigate();

    useEffect(() => {
        getHistory();
    }, []);

    return (
    <div className={styles.page}>
        <div className={styles.container}>
            <h1>Room History</h1>

            {history.length === 0 ? (
                <p className={styles.empty}>
                    No room history available
                </p>
            ) : (
                history.map((room) => (
                    <div
                        className={styles.historyCard}
                        key={room._id}
                    >
                        <h3>{room.roomName}</h3>

                        <p>
                            Room ID: {room.roomId}
                        </p>

                        <p>
                            Started:{" "}
                            {new Date(
                                room.startedAt
                            ).toLocaleString()}
                        </p>

                        <p>
                            Ended:{" "}
                            {new Date(
                                room.endedAt
                            ).toLocaleString()}
                        </p>
                    </div>
                ))
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

export default History;