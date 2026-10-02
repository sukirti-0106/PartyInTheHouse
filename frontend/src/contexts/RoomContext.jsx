import { createContext, useContext, useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const RoomContext = createContext();

const API = "https://partyinthehouse.onrender.com/api";

export const RoomProvider = ({ children }) => {
    const { token } = useAuth();
    const [rooms, setRooms] = useState([]);
    const [history, setHistory] = useState([]);

    const getHeaders = () => {
        return {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
    };

    const createRoom = async (name, videoId) => {
        const response = await axios.post(
            `${API}/rooms/create`,
            {
                name,
                videoId
            },
            getHeaders()
        );

        setRooms((prev) => [
            response.data.room,
            ...prev
        ]);

        return response.data.room;
    };

    const getRooms = async () => {
        const response = await axios.get(
            `${API}/rooms`,
            getHeaders()
        );

        setRooms(response.data.rooms);

        return response.data.rooms;
    };

    const getRoom = async (roomId) => {
        const response = await axios.get(
            `${API}/rooms/${roomId}`,
            getHeaders()
        );

        return response.data.room;
    };

    const joinRoom = async (roomId) => {
        const response = await axios.post(
            `${API}/rooms/${roomId}/join`,
            {},
            getHeaders()
        );

        return response.data.room;
    };

    const getHistory = async () => {
        const response = await axios.get(
            `${API}/rooms/history`,
            getHeaders()
        );

        setHistory(response.data.history);

        return response.data.history;
    };

    const endRoom = async (roomId) => {
        const response = await axios.post(
            `${API}/rooms/${roomId}/end`,
            {},
            getHeaders()
        );

        setRooms((prev) =>
            prev.filter((room) => room.roomId !== roomId)
        );

        return response.data;
    };

    return (
        <RoomContext.Provider
            value={{
                rooms,
                history,
                createRoom,
                getRooms,
                getRoom,
                joinRoom,
                getHistory,
                endRoom
            }}
        >
            {children}
        </RoomContext.Provider>
    );
};

export const useRoom = () => {
    return useContext(RoomContext);
};