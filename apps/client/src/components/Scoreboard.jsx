const Scoreboard = ({ state }) => {
    if (!state) {
        return <div className="panel scoreboard loading-card">Loading scoreboard...</div>;
    }

    return (
        <div className="scoreboard panel">
            <div className="set-badge">Set {state.set} Live</div>
            <div className="teams">
                <div className="team-card">
                    <h2>{state.teamA.name}</h2>
                    <p className="score">{state.teamA.score}</p>
                </div>
                <div className="vs">VS</div>
                <div className="team-card">
                    <h2>{state.teamB.name}</h2>
                    <p className="score">{state.teamB.score}</p>
                </div>
            </div>
            <p className="stamp">Updated: {new Date(state.updatedAt).toLocaleTimeString()}</p>
        </div>
    );
};

export default Scoreboard;
