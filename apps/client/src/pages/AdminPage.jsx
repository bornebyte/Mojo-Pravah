import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api";
import { connectSocket, disconnectSocket } from "../socket";
import { getAuth } from "../auth";
import Scoreboard from "../components/Scoreboard";
import BrandBanner from "../components/BrandBanner";

const formatStage = (stage) => {
    if (!stage) return "Normal";
    if (stage === "semi-final") return "Semi-Final";
    if (stage === "final") return "Final";
    return "Normal";
};

const AdminPage = ({ user, onLogout }) => {
    const [state, setState] = useState(null);
    const [pending, setPending] = useState(false);
    const [teamNames, setTeamNames] = useState({ teamAName: "", teamBName: "" });
    const [setInfo, setSetInfo] = useState({ set: 1, liveLabel: "Live" });
    const [error, setError] = useState("");
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersError, setUsersError] = useState("");
    const [usersUpdatedAt, setUsersUpdatedAt] = useState("");
    const [userStatusFilter, setUserStatusFilter] = useState("all");
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [presence, setPresence] = useState({ onlineUsers: 0, totalConnections: 0 });
    const [history, setHistory] = useState([]);
    const [historyError, setHistoryError] = useState("");
    const [historyLoading, setHistoryLoading] = useState(false);
    const [saveStage, setSaveStage] = useState("normal");
    const [saveNotes, setSaveNotes] = useState("");
    const [saveConfirm, setSaveConfirm] = useState(false);
    const [savingHistory, setSavingHistory] = useState(false);
    const [editingId, setEditingId] = useState("");
    const [editForm, setEditForm] = useState({
        stage: "normal",
        set: 1,
        liveLabel: "Live",
        teamAName: "",
        teamAScore: 0,
        teamBName: "",
        teamBScore: 0,
        notes: "",
    });

    const canSaveCurrentMatch = Boolean(state && state.teamA.score !== state.teamB.score);

    const loadHistory = async (isSilent = false) => {
        if (!isSilent) {
            setHistoryLoading(true);
        }
        setHistoryError("");

        try {
            const { data } = await api.get("/match/history");
            setHistory(data.matches || []);
        } catch (requestError) {
            setHistoryError(requestError.response?.data?.message || "Failed to load previous matches");
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
        socket?.on("presence:count", (nextPresence) => {
            setPresence({
                onlineUsers: nextPresence.onlineUsers,
                totalConnections: nextPresence.totalConnections,
            });
        });
        socket?.on("history:update", () => {
            loadHistory(true);
        });

        return () => {
            isMounted = false;
            socket?.off("score:update");
            socket?.off("presence:count");
            socket?.off("history:update");
            disconnectSocket();
        };
    }, [onLogout]);

    useEffect(() => {
        if (!state) return;
        setTeamNames({ teamAName: state.teamA.name, teamBName: state.teamB.name });
        setSetInfo({ set: state.set || 1, liveLabel: state.liveLabel || "Live" });
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

    const updateSetBanner = async () => {
        setError("");
        setPending(true);
        try {
            const { data } = await api.patch("/match/set-info", {
                set: Number(setInfo.set),
                liveLabel: setInfo.liveLabel,
            });
            setState(data);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Failed to update live set banner");
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

    const saveCurrentMatch = async () => {
        if (!canSaveCurrentMatch) {
            setHistoryError("Match must have a winner before saving.");
            return;
        }

        if (!saveConfirm) {
            setHistoryError("Please confirm this result is final before saving.");
            return;
        }

        setHistoryError("");
        setSavingHistory(true);
        try {
            await api.post("/match/history", {
                stage: saveStage,
                notes: saveNotes,
                isConfirmed: saveConfirm,
            });
            setSaveConfirm(false);
            setSaveNotes("");
            await loadHistory(true);
        } catch (requestError) {
            setHistoryError(requestError.response?.data?.message || "Failed to save current match");
        } finally {
            setSavingHistory(false);
        }
    };

    const startEditing = (entry) => {
        setEditingId(entry.id);
        setEditForm({
            stage: entry.stage,
            set: entry.set,
            liveLabel: entry.liveLabel || "Live",
            teamAName: entry.teamA.name,
            teamAScore: entry.teamA.score,
            teamBName: entry.teamB.name,
            teamBScore: entry.teamB.score,
            notes: entry.notes || "",
        });
    };

    const cancelEditing = () => {
        setEditingId("");
    };

    const saveEdit = async () => {
        if (!editingId) return;

        setHistoryError("");
        setSavingHistory(true);

        try {
            await api.put(`/match/history/${editingId}`, {
                stage: editForm.stage,
                set: Number(editForm.set),
                liveLabel: editForm.liveLabel,
                teamA: {
                    name: editForm.teamAName,
                    score: Number(editForm.teamAScore),
                },
                teamB: {
                    name: editForm.teamBName,
                    score: Number(editForm.teamBScore),
                },
                notes: editForm.notes,
            });
            setEditingId("");
            await loadHistory(true);
        } catch (requestError) {
            setHistoryError(requestError.response?.data?.message || "Failed to update match record");
        } finally {
            setSavingHistory(false);
        }
    };

    const filteredUsers = users.filter((entry) => {
        const statusMatch =
            userStatusFilter === "all" ||
            (userStatusFilter === "online" && entry.online) ||
            (userStatusFilter === "offline" && !entry.online);

        const needle = userSearchQuery.trim().toLowerCase();
        const searchMatch =
            !needle ||
            String(entry.name || "").toLowerCase().includes(needle) ||
            String(entry.email || "").toLowerCase().includes(needle);

        return statusMatch && searchMatch;
    });

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

                <div className="name-grid">
                    <label>
                        Live set number
                        <input
                            type="number"
                            min={1}
                            max={9}
                            value={setInfo.set}
                            onChange={(event) => setSetInfo((prev) => ({ ...prev, set: event.target.value }))}
                        />
                    </label>
                    <label>
                        Live badge text
                        <input
                            value={setInfo.liveLabel}
                            maxLength={24}
                            onChange={(event) => setSetInfo((prev) => ({ ...prev, liveLabel: event.target.value }))}
                            placeholder="Live"
                        />
                    </label>
                </div>
                <button disabled={pending} className="ghost" onClick={updateSetBanner}>Update Set Banner</button>
                <br />
                <br />

                <div className="button-grid">
                    <button disabled={pending} className="cta" onClick={() => changeScore("A", 1)}>Team A +1</button>
                    <button disabled={pending} className="danger" onClick={() => changeScore("A", -1)}>Team A -1</button>
                    <button disabled={pending} className="cta" onClick={() => changeScore("B", 1)}>Team B +1</button>
                    <button disabled={pending} className="danger" onClick={() => changeScore("B", -1)}>Team B -1</button>
                </div>
                <button disabled={pending} className="danger" onClick={reset}>Reset Match</button>
                {error ? <p className="error-text">{error}</p> : null}
            </section>

            <section className="panel controls history-panel">
                <h3>Save Completed Match</h3>
                <p className="helper">When any team wins, save the complete result to Firebase with match type.</p>

                <div className="history-form-grid">
                    <label>
                        Match type
                        <select value={saveStage} onChange={(event) => setSaveStage(event.target.value)}>
                            <option value="normal">Normal</option>
                            <option value="semi-final">Semi-Final</option>
                            <option value="final">Final</option>
                        </select>
                    </label>

                    <label>
                        Notes (optional)
                        <input
                            value={saveNotes}
                            onChange={(event) => setSaveNotes(event.target.value)}
                            placeholder="Example: Match 3, court-2"
                            maxLength={160}
                        />
                    </label>
                </div>

                <label className="checkbox-row">
                    <input type="checkbox" checked={saveConfirm} onChange={(event) => setSaveConfirm(event.target.checked)} />
                    <span>I confirm this entry is final and ready to save</span>
                </label>

                <button className="cta" disabled={savingHistory || !canSaveCurrentMatch} onClick={saveCurrentMatch}>
                    {savingHistory ? "Saving..." : "Save Current Match"}
                </button>
                {!canSaveCurrentMatch ? <p className="helper">A winner is required before saving.</p> : null}
                {historyError ? <p className="error-text">{historyError}</p> : null}
            </section>

            <section className="panel users-panel history-results-panel">
                <div className="users-header">
                    <h3>Previous Match Records</h3>
                    <button className="ghost" onClick={() => loadHistory()} disabled={historyLoading}>
                        {historyLoading ? "Refreshing..." : "Refresh History"}
                    </button>
                </div>

                <p className="helper">You can edit old records here if there was any wrong data entry.</p>

                <div className="users-table-wrap">
                    <table className="users-table history-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Team A</th>
                                <th>Team B</th>
                                <th>Winner</th>
                                <th>Set</th>
                                <th>Updated</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length ? (
                                history.map((entry) => (
                                    <tr key={entry.id}>
                                        <td>{formatStage(entry.stage)}</td>
                                        <td>{entry.teamA.name} ({entry.teamA.score})</td>
                                        <td>{entry.teamB.name} ({entry.teamB.score})</td>
                                        <td>{entry.winner}</td>
                                        <td>Set {entry.set} {entry.liveLabel || "Live"}</td>
                                        <td>{new Date(entry.updatedAt).toLocaleString()}</td>
                                        <td>
                                            {editingId === entry.id ? (
                                                <div className="table-actions">
                                                    <button className="cta" onClick={saveEdit} disabled={savingHistory}>Save</button>
                                                    <button className="ghost" onClick={cancelEditing} disabled={savingHistory}>Cancel</button>
                                                </div>
                                            ) : (
                                                <button className="ghost" onClick={() => startEditing(entry)}>Edit</button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7}>No previous matches saved yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {editingId ? (
                    <div className="edit-card">
                        <h4>Edit Match Record</h4>
                        <div className="history-form-grid">
                            <label>
                                Match type
                                <select
                                    value={editForm.stage}
                                    onChange={(event) => setEditForm((prev) => ({ ...prev, stage: event.target.value }))}
                                >
                                    <option value="normal">Normal</option>
                                    <option value="semi-final">Semi-Final</option>
                                    <option value="final">Final</option>
                                </select>
                            </label>
                            <label>
                                Set
                                <input
                                    type="number"
                                    min={1}
                                    max={9}
                                    value={editForm.set}
                                    onChange={(event) => setEditForm((prev) => ({ ...prev, set: event.target.value }))}
                                />
                            </label>
                            <label>
                                Live label
                                <input
                                    value={editForm.liveLabel}
                                    maxLength={24}
                                    onChange={(event) => setEditForm((prev) => ({ ...prev, liveLabel: event.target.value }))}
                                />
                            </label>
                            <label>
                                Team A name
                                <input
                                    value={editForm.teamAName}
                                    onChange={(event) => setEditForm((prev) => ({ ...prev, teamAName: event.target.value }))}
                                />
                            </label>
                            <label>
                                Team A score
                                <input
                                    type="number"
                                    min={0}
                                    value={editForm.teamAScore}
                                    onChange={(event) => setEditForm((prev) => ({ ...prev, teamAScore: event.target.value }))}
                                />
                            </label>
                            <label>
                                Team B name
                                <input
                                    value={editForm.teamBName}
                                    onChange={(event) => setEditForm((prev) => ({ ...prev, teamBName: event.target.value }))}
                                />
                            </label>
                            <label>
                                Team B score
                                <input
                                    type="number"
                                    min={0}
                                    value={editForm.teamBScore}
                                    onChange={(event) => setEditForm((prev) => ({ ...prev, teamBScore: event.target.value }))}
                                />
                            </label>
                        </div>

                        <label>
                            Notes
                            <input
                                value={editForm.notes}
                                onChange={(event) => setEditForm((prev) => ({ ...prev, notes: event.target.value }))}
                                maxLength={160}
                            />
                        </label>
                    </div>
                ) : null}
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

                <div className="history-form-grid">
                    <label>
                        Status filter
                        <select value={userStatusFilter} onChange={(event) => setUserStatusFilter(event.target.value)}>
                            <option value="all">All users</option>
                            <option value="online">Online only</option>
                            <option value="offline">Offline only</option>
                        </select>
                    </label>
                    <label>
                        Search by name or email
                        <input
                            value={userSearchQuery}
                            onChange={(event) => setUserSearchQuery(event.target.value)}
                            placeholder="Type name or email"
                        />
                    </label>
                </div>

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
                            {filteredUsers.length ? (
                                filteredUsers.map((entry) => (
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
                                    <td colSpan={5}>No users match the current filters. Press Refresh Users to load data.</td>
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
