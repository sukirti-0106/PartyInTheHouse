import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { RoomProvider } from "./contexts/RoomContext";

ReactDOM.createRoot(
    document.getElementById("root")
).render(
    <React.StrictMode>
        <AuthProvider>
           <RoomProvider>
             <App />
           </RoomProvider>
           
        </AuthProvider>
    </React.StrictMode>
);