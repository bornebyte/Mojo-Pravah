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
        ...defaultState,
        updatedAt: new Date().toISOString(),
    };

    return matchState;
};

module.exports = {
    getMatchState,
    updateScore,
    resetMatch,
};
