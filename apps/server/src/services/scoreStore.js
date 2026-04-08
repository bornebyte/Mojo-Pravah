const defaultState = {
    teamA: {
        name: "Team A",
        score: 0,
    },
    teamB: {
        name: "Team B",
        score: 0,
    },
    set: 1,
    updatedAt: new Date().toISOString(),
};

let matchState = { ...defaultState };

const sanitizeTeamName = (name, label) => {
    const normalized = String(name || "").trim();
    if (normalized.length < 2 || normalized.length > 40) {
        throw new Error(`${label} must be between 2 and 40 characters`);
    }
    return normalized;
};

const getMatchState = () => matchState;

const updateScore = ({ team, delta }) => {
    if (team !== "A" && team !== "B") {
        throw new Error("Team must be A or B");
    }

    const key = team === "A" ? "teamA" : "teamB";
    const nextScore = Math.max(0, matchState[key].score + delta);

    matchState = {
        ...matchState,
        [key]: {
            ...matchState[key],
            score: nextScore,
        },
        updatedAt: new Date().toISOString(),
    };

    return matchState;
};

const resetMatch = () => {
    matchState = {
        ...matchState,
        teamA: {
            ...matchState.teamA,
            score: 0,
        },
        teamB: {
            ...matchState.teamB,
            score: 0,
        },
        set: 1,
        updatedAt: new Date().toISOString(),
    };

    return matchState;
};

const updateTeamNames = ({ teamAName, teamBName }) => {
    const nextTeamAName = sanitizeTeamName(teamAName, "Team A name");
    const nextTeamBName = sanitizeTeamName(teamBName, "Team B name");

    matchState = {
        ...matchState,
        teamA: {
            ...matchState.teamA,
            name: nextTeamAName,
        },
        teamB: {
            ...matchState.teamB,
            name: nextTeamBName,
        },
        updatedAt: new Date().toISOString(),
    };

    return matchState;
};

module.exports = {
    getMatchState,
    updateScore,
    resetMatch,
    updateTeamNames,
};
