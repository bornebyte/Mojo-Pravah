const crypto = require("crypto");
const { requireFirestore } = require("../firebase");

const COLLECTION_NAME = "match_history";
const allowedStages = new Set(["normal", "semi-final", "final"]);

const normalizeStage = (stage) => {
    const normalized = String(stage || "").trim().toLowerCase();
    if (!allowedStages.has(normalized)) {
        throw new Error("Stage must be normal, semi-final, or final");
    }
    return normalized;
};

const normalizeTeam = (team, label) => {
    const name = String(team?.name || "").trim();
    const score = Number(team?.score);

    if (name.length < 2 || name.length > 40) {
        throw new Error(`${label} name must be between 2 and 40 characters`);
    }

    if (!Number.isInteger(score) || score < 0) {
        throw new Error(`${label} score must be an integer >= 0`);
    }

    return { name, score };
};

const normalizeSet = (setValue) => {
    const numericSet = Number(setValue);
    if (!Number.isInteger(numericSet) || numericSet < 1 || numericSet > 9) {
        throw new Error("Set must be an integer between 1 and 9");
    }
    return numericSet;
};

const normalizeUpdatedBy = (email) => {
    const normalized = String(email || "").trim().toLowerCase();
    if (!normalized) {
        throw new Error("Updated by email is required");
    }
    return normalized;
};

const toResponse = (data) => ({
    id: data.id,
    stage: data.stage,
    winner: data.winner,
    teamA: data.teamA,
    teamB: data.teamB,
    set: data.set,
    notes: data.notes || "",
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    updatedBy: data.updatedBy,
    savedAt: data.savedAt,
});

const listMatches = async () => {
    const db = requireFirestore();
    const snapshot = await db.collection(COLLECTION_NAME).orderBy("createdAt", "desc").get();
    return snapshot.docs.map((doc) => toResponse(doc.data()));
};

const saveMatch = async ({ stage, matchState, updatedBy, notes = "" }) => {
    const db = requireFirestore();
    const teamA = normalizeTeam(matchState?.teamA, "Team A");
    const teamB = normalizeTeam(matchState?.teamB, "Team B");

    if (teamA.score === teamB.score) {
        throw new Error("Cannot save a match with a tied score");
    }

    const now = new Date().toISOString();
    const payload = {
        id: crypto.randomUUID(),
        stage: normalizeStage(stage),
        winner: teamA.score > teamB.score ? teamA.name : teamB.name,
        teamA,
        teamB,
        set: normalizeSet(matchState?.set),
        notes: String(notes || "").trim().slice(0, 160),
        createdAt: now,
        updatedAt: now,
        updatedBy: normalizeUpdatedBy(updatedBy),
        savedAt: matchState?.updatedAt || now,
    };

    await db.collection(COLLECTION_NAME).doc(payload.id).set(payload);
    return toResponse(payload);
};

const updateMatch = async (id, { stage, teamA, teamB, set, notes = "", updatedBy }) => {
    const db = requireFirestore();
    const normalizedId = String(id || "").trim();
    if (!normalizedId) {
        throw new Error("Match id is required");
    }

    const nextTeamA = normalizeTeam(teamA, "Team A");
    const nextTeamB = normalizeTeam(teamB, "Team B");

    if (nextTeamA.score === nextTeamB.score) {
        throw new Error("Scores cannot be tied when updating a completed match");
    }

    const docRef = db.collection(COLLECTION_NAME).doc(normalizedId);
    const existing = await docRef.get();
    if (!existing.exists) {
        throw new Error("Match record not found");
    }

    const payload = {
        stage: normalizeStage(stage),
        teamA: nextTeamA,
        teamB: nextTeamB,
        winner: nextTeamA.score > nextTeamB.score ? nextTeamA.name : nextTeamB.name,
        set: normalizeSet(set),
        notes: String(notes || "").trim().slice(0, 160),
        updatedAt: new Date().toISOString(),
        updatedBy: normalizeUpdatedBy(updatedBy),
    };

    await docRef.update(payload);
    const merged = { ...existing.data(), ...payload };
    return toResponse(merged);
};

module.exports = {
    allowedStages: Array.from(allowedStages.values()),
    listMatches,
    saveMatch,
    updateMatch,
};
