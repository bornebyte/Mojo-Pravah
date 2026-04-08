import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api";
import { connectSocket, disconnectSocket } from "../socket";
import { getAuth } from "../auth";
import Scoreboard from "../components/Scoreboard";

const AdminPage = ({ user, onLogout }) => {
    const [state, setState] = useState(null);
    const [pending, setPending] = useState(false);
    const [teamNames, setTeamNames] = useState({ teamAName: "", teamBName: "" });
    const [error, setError] = useState("");

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

    useEffect(() => {
        if (!state) return;
        setTeamNames({ teamAName: state.teamA.name, teamBName: state.teamB.name });
    }, [state]);

    if (!user) return <Navigate to="/login" replace />;

    const changeScore = async (team, delta) => {
        setError("");
        setPending(true);
        try {
            const { data } = await api.patch("/match/score", { team, delta });
            setState(data);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Failed to update score");
        } finally {
            setPending(false);
        }
    };

    const reset = async () => {
        setError("");
        setPending(true);
        try {
            const { data } = await api.patch("/match/reset");
            setState(data);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Failed to reset match");
        } finally {
            setPending(false);
        }
    };

    const updateNames = async () => {
        setError("");
        setPending(true);
        try {
            const { data } = await api.patch("/match/teams", {
                teamAName: teamNames.teamAName,
                teamBName: teamNames.teamBName,
            });
            setState(data);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Failed to update team names");
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

                <div className="name-grid">
                    <label>
                        Team A name
                        <input
                            value={teamNames.teamAName}
                            onChange={(event) => setTeamNames((prev) => ({ ...prev, teamAName: event.target.value }))}
                            placeholder="Team A"
                        />
                    </label>
                    <label>
                        Team B name
                        <input
                            value={teamNames.teamBName}
                            onChange={(event) => setTeamNames((prev) => ({ ...prev, teamBName: event.target.value }))}
                            placeholder="Team B"
                        />
                    </label>
                </div>
                <button disabled={pending} className="ghost" onClick={updateNames}>Update Team Names</button>

                <div className="button-grid">
                    <button disabled={pending} className="cta" onClick={() => changeScore("A", 1)}>Team A +1</button>
                    <button disabled={pending} className="ghost" onClick={() => changeScore("A", -1)}>Team A -1</button>
                    <button disabled={pending} className="cta" onClick={() => changeScore("B", 1)}>Team B +1</button>
                    <button disabled={pending} className="ghost" onClick={() => changeScore("B", -1)}>Team B -1</button>
                </div>
                <button disabled={pending} className="danger" onClick={reset}>Reset Match</button>
                {error ? <p className="error-text">{error}</p> : null}
            </section>
        </main>
    );
};

export default AdminPage;
