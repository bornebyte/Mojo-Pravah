import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api";
import { connectSocket, disconnectSocket } from "../socket";
import { getAuth } from "../auth";
import Scoreboard from "../components/Scoreboard";
import BrandBanner from "../components/BrandBanner";

const AdminPage = ({ user, onLogout }) => {
    const [state, setState] = useState(null);
    const [pending, setPending] = useState(false);
    const [teamNames, setTeamNames] = useState({ teamAName: "", teamBName: "" });
    const [error, setError] = useState("");
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersError, setUsersError] = useState("");
    const [usersUpdatedAt, setUsersUpdatedAt] = useState("");
    const [presence, setPresence] = useState({ onlineUsers: 0, totalConnections: 0 });

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
        socket?.on("presence:count", (nextPresence) => {
            setPresence({
                onlineUsers: nextPresence.onlineUsers,
                totalConnections: nextPresence.totalConnections,
            });
        });

        return () => {
            isMounted = false;
            socket?.off("score:update");
            socket?.off("presence:count");
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

    const refreshUsers = async () => {
        setUsersLoading(true);
        setUsersError("");

        try {
            const { data } = await api.get("/admin/users");
            setUsers(data.users);
            setUsersUpdatedAt(data.updatedAt);
            setPresence({
                onlineUsers: data.onlineUsers,
                totalConnections: data.totalConnections,
            });
        } catch (requestError) {
            setUsersError(requestError.response?.data?.message || "Failed to fetch users");
        } finally {
            setUsersLoading(false);
        }
    };

    return (
        <main className="screen">
            <header className="topbar">
                <BrandBanner title="Mojo Pravah Control" subtitle={`Admin: ${user.name}`} />
                <p className="live-pill">Live joined users: {presence.onlineUsers}</p>
                <button className="danger" onClick={onLogout}>Logout</button>
            </header>

            <Scoreboard state={state} />

            <section className="panel controls admin-grid">
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
                <br />
                <br />

                <div className="button-grid">
                    <button disabled={pending} className="success" onClick={() => changeScore("A", 1)}>Team A +1</button>
                    <button disabled={pending} className="danger" onClick={() => changeScore("A", -1)}>Team A -1</button>
                    <button disabled={pending} className="success" onClick={() => changeScore("B", 1)}>Team B +1</button>
                    <button disabled={pending} className="danger" onClick={() => changeScore("B", -1)}>Team B -1</button>
                </div>
                <button disabled={pending} className="danger" onClick={reset}>Reset Match</button>
                {error ? <p className="error-text">{error}</p> : null}
            </section>

            <section className="panel users-panel">
                <div className="users-header">
                    <h3>Audience Monitor</h3>
                    <button className="ghost" onClick={refreshUsers} disabled={usersLoading}>
                        {usersLoading ? "Refreshing..." : "Refresh Users"}
                    </button>
                </div>

                <p className="helper">
                    Online users now: <strong>{presence.onlineUsers}</strong> | Active socket sessions: <strong>{presence.totalConnections}</strong>
                </p>
                {usersUpdatedAt ? <p className="stamp">Last manual refresh: {new Date(usersUpdatedAt).toLocaleString()}</p> : null}
                {usersError ? <p className="error-text">{usersError}</p> : null}

                <div className="users-table-wrap">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Connections</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length ? (
                                users.map((entry) => (
                                    <tr key={entry.id}>
                                        <td>{entry.name}</td>
                                        <td>{entry.email}</td>
                                        <td className="caps">{entry.role}</td>
                                        <td>
                                            <span className={entry.online ? "status-dot online" : "status-dot offline"}>
                                                {entry.online ? "Online" : "Offline"}
                                            </span>
                                        </td>
                                        <td>{entry.socketConnections}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5}>No snapshot yet. Press Refresh Users to load details.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
};

export default AdminPage;
