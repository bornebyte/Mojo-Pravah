import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api";
import { connectSocket, disconnectSocket } from "../socket";
import { getAuth } from "../auth";
import Scoreboard from "../components/Scoreboard";
import BrandBanner from "../components/BrandBanner";

const formatStage = (stage) => {
    if (stage === "semi-final") return "Semi-Final";
    if (stage === "final") return "Final";
    return "Normal";
};

const ViewerPage = ({ user, onLogout }) => {
    const [state, setState] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState("");

    const loadHistory = async (isSilent = false) => {
        if (!isSilent) {
            setHistoryLoading(true);
        }
        setHistoryError("");
        try {
            const { data } = await api.get("/match/history");
            setHistory(data.matches || []);
        } catch (requestError) {
            setHistoryError(requestError.response?.data?.message || "Failed to load previous results");
        } finally {
            if (!isSilent) {
                setHistoryLoading(false);
            }
        }
    };

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            const { data } = await api.get("/match/current");
            if (isMounted) setState(data);
            await loadHistory(true);
        };

        load().catch(() => onLogout());

        const { token } = getAuth();
        const socket = connectSocket(token);

        socket?.on("score:update", (nextState) => {
            setState(nextState);
        });
        socket?.on("history:update", () => {
            loadHistory(true);
        });

        return () => {
            isMounted = false;
            socket?.off("score:update");
            socket?.off("history:update");
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

            <section className="panel users-panel history-results-panel">
                <div className="users-header">
                    <h3>Previous Match Results</h3>
                    <button className="ghost" onClick={() => loadHistory()} disabled={historyLoading}>
                        {historyLoading ? "Refreshing..." : "Refresh Results"}
                    </button>
                </div>

                {historyError ? <p className="error-text">{historyError}</p> : null}

                <div className="users-table-wrap">
                    <table className="users-table history-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Teams</th>
                                <th>Score</th>
                                <th>Winner</th>
                                <th>Set</th>
                                <th>Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length ? (
                                history.map((entry) => (
                                    <tr key={entry.id}>
                                        <td>{formatStage(entry.stage)}</td>
                                        <td>{entry.teamA.name} vs {entry.teamB.name}</td>
                                        <td>{entry.teamA.score} - {entry.teamB.score}</td>
                                        <td>{entry.winner}</td>
                                        <td>{entry.set}</td>
                                        <td>{new Date(entry.updatedAt).toLocaleString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6}>No previous results available yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
};

export default ViewerPage;
