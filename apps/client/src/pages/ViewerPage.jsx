import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api";
import { connectSocket, disconnectSocket } from "../socket";
import { getAuth } from "../auth";
import Scoreboard from "../components/Scoreboard";
import BrandBanner from "../components/BrandBanner";

const ViewerPage = ({ user, onLogout }) => {
    const [state, setState] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            const { data } = await api.get("/match/current");
            if (isMounted) setState(data);
        };

        load().catch(() => onLogout());

        const { token } = getAuth();
        const socket = connectSocket(token);

        socket?.on("score:update", (nextState) => {
            setState(nextState);
        });

        return () => {
            isMounted = false;
            socket?.off("score:update");
            disconnectSocket();
        };
    }, [onLogout]);

    if (!user) return <Navigate to="/login" replace />;

    return (
        <main className="screen">
            <header className="topbar">
                <BrandBanner title="Mojo Pravah" subtitle={`Welcome ${user.name}. Enjoy the live scoreboard.`} />
                <button className="danger" onClick={onLogout}>Logout</button>
            </header>
            <Scoreboard state={state} />
        </main>
    );
};

export default ViewerPage;
