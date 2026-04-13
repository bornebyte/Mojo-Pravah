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
    liveLabel: "Live",
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

const sanitizeSet = (setValue) => {
    const parsed = Number(setValue);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 9) {
        throw new Error("Set must be an integer between 1 and 9");
    }
    return parsed;
};

const sanitizeLiveLabel = (liveLabel) => {
    const normalized = String(liveLabel || "").trim();
    if (normalized.length < 2 || normalized.length > 24) {
        throw new Error("Live label must be between 2 and 24 characters");
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
        liveLabel: "Live",
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

const updateSetInfo = ({ set, liveLabel }) => {
    const nextSet = sanitizeSet(set);
    const nextLiveLabel = sanitizeLiveLabel(liveLabel);

    matchState = {
        ...matchState,
        set: nextSet,
        liveLabel: nextLiveLabel,
        updatedAt: new Date().toISOString(),
    };

    return matchState;
};

module.exports = {
    getMatchState,
    updateScore,
    resetMatch,
    updateTeamNames,
    updateSetInfo,
};
