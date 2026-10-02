import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(
        JSON.parse(sessionStorage.getItem("user")) || null
    );

    const [token, setToken] = useState(
        sessionStorage.getItem("token") || null
    );

    const login = (data) => {
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem(
            "user",
            JSON.stringify(data.user)
        );

        setToken(data.token);
        setUser(data.user);
    };

    const logout = () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                logout,
                isAuthenticated: !!token
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};