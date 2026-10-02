import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const WithAuth = ({ children }) => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/authentication" />;
    }

    return children;
};

export default WithAuth;