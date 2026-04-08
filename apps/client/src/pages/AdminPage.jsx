import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api";
import { connectSocket, disconnectSocket } from "../socket";
import { getAuth } from "../auth";
import Scoreboard from "../components/Scoreboard";

const AdminPage = ({ user, onLogout }) => {
    const [state, setState] = useState(null);
    const [pending, setPending] = useState(false);

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

    const changeScore = async (team, delta) => {
        setPending(true);
        try {
            const { data } = await api.patch("/match/score", { team, delta });
            setState(data);
        } finally {
            setPending(false);
        }
    };

    const reset = async () => {
        setPending(true);
        try {
            const { data } = await api.patch("/match/reset");
            setState(data);
        } finally {
            setPending(false);
        }
    };

    return (
        <main className="screen">
            <header className="topbar">
                <p>
                    Admin mode: <strong>{user.name}</strong>
                </p>
                <button className="ghost" onClick={onLogout}>Logout</button>
            </header>

            <Scoreboard state={state} />

            <section className="panel controls">
                <h3>Scoring controls</h3>
                <div className="button-grid">
                    <button disabled={pending} className="cta" onClick={() => changeScore("A", 1)}>Team A +1</button>
                    <button disabled={pending} className="ghost" onClick={() => changeScore("A", -1)}>Team A -1</button>
                    <button disabled={pending} className="cta" onClick={() => changeScore("B", 1)}>Team B +1</button>
                    <button disabled={pending} className="ghost" onClick={() => changeScore("B", -1)}>Team B -1</button>
                </div>
                <button disabled={pending} className="danger" onClick={reset}>Reset Match</button>
            </section>
        </main>
    );
};

export default AdminPage;
