import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRoom } from "../contexts/RoomContext";
import styles from "../styles/Pages.module.css";

const getYouTubeId = (url) => {
    try {
        const parsedUrl = new URL(url);

        if (parsedUrl.hostname.includes("youtu.be")) {
            return parsedUrl.pathname.slice(1);
        }

        if (
            parsedUrl.hostname.includes("youtube.com") ||
            parsedUrl.hostname.includes("www.youtube.com")
        ) {
            return parsedUrl.searchParams.get("v");
        }

        return null;
    } catch {
        return null;
    }
};

const CreateRoom = () => {
    const [name, setName] = useState("");
    const [videoLink, setVideoLink] = useState("");
    const [message, setMessage] = useState("");

    const { createRoom } = useRoom();
    const navigate = useNavigate();

    const handleCreate = async (e) => {
        e.preventDefault();

        const videoId = getYouTubeId(videoLink);

        if (!videoId) {
            setMessage("Please enter a valid YouTube video link");
            return;
        }

        try {
            const room = await createRoom(
                name,
                videoId
            );

            navigate(`/room/${room.roomId}`);
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Unable to create room"
            );
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.formContainer}>
                <h1>Create Watch Party</h1>

                <form
                    className={styles.form}
                    onSubmit={handleCreate}
                >
                    <div className={styles.inputGroup}>
                        <label>Room Name</label>
                        <input
                            className={styles.input}
                            type="text"
                            placeholder="Enter room name"
                            value={name}
                            onChange={(e) =>
                                setName(e.target.value)
                            }
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>YouTube Video Link</label>
                        <input
                            className={styles.input}
                            type="text"
                            placeholder="Paste YouTube video link"
                            value={videoLink}
                            onChange={(e) =>
                                setVideoLink(e.target.value)
                            }
                            required
                        />
                    </div>

                    <button
                        className={styles.primaryButton}
                        type="submit"
                    >
                        Create Room
                    </button>
                </form>

                {message && (
                    <p className={styles.message}>
                        {message}
                    </p>
                )}

                <button
                    className={`${styles.secondaryButton} ${styles.backButton}`}
                    onClick={() => navigate("/home")}
                >
                    Back
                </button>
            </div>
        </div>
    );
};

export default CreateRoom;