import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Authentication from "./pages/Authentication";
import HomeComponent from "./pages/HomeComponent";
import CreateRoom from "./pages/CreateRoom";
import JoinRoom from "./pages/JoinRoom";
import History from "./pages/History";
import WithAuth from "./utils/withAuth";
import WatchParty from "./pages/WatchParty";



const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/authentication"
                    element={<Authentication />}
                />

                <Route
                    path="/home"
                    element={
                        <WithAuth>
                            <HomeComponent />
                        </WithAuth>
                    }
                />
                 <Route
                    path="/watch/:roomId"
                    element={<WatchParty />}
                />

                <Route
                    path="/create-room"
                    element={
                        <WithAuth>
                            <CreateRoom />
                        </WithAuth>
                    }
                />

                <Route
                    path="/join-room"
                    element={
                        <WithAuth>
                            <JoinRoom />
                        </WithAuth>
                    }
                />

                <Route
                    path="/history"
                    element={
                        <WithAuth>
                            <History />
                        </WithAuth>
                    }
                />

                <Route
    path="/room/:roomId"
    element={
        <WithAuth>
            <WatchParty />
        </WithAuth>
    }
/>

                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/authentication"
                        />
                    }
                />
            </Routes>
        </BrowserRouter>
    );
};

export default App;