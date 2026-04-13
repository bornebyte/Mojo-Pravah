const crypto = require("crypto");
const { requireFirestore } = require("../firebase");

const COLLECTION_NAME = "feedback";
const ALLOWED_PAGES = new Set(["admin", "viewer"]);

const normalizeRating = (rating) => {
    const parsed = Number(rating);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
        throw new Error("Rating must be an integer between 1 and 5");
    }
    return parsed;
};

const normalizeComment = (comment) => {
    const normalized = String(comment || "").trim();
    if (normalized.length < 3 || normalized.length > 500) {
        throw new Error("Comment must be between 3 and 500 characters");
    }
    return normalized;
};

const normalizePage = (page) => {
    const normalized = String(page || "").trim().toLowerCase();
    if (!ALLOWED_PAGES.has(normalized)) {
        throw new Error("Page must be either admin or viewer");
    }
    return normalized;
};

const normalizeIp = (ip) => String(ip || "").trim().slice(0, 100);
const normalizeUserAgent = (userAgent) => String(userAgent || "").trim().slice(0, 300);

const saveFeedback = async ({ rating, comment, page, user, ip, userAgent }) => {
    const db = requireFirestore();
    const now = new Date().toISOString();

    if (!user?.id || !user?.email || !user?.role || !user?.name) {
        throw new Error("Authenticated user details are required");
    }

    const payload = {
        id: crypto.randomUUID(),
        rating: normalizeRating(rating),
        comment: normalizeComment(comment),
        page: normalizePage(page),
        user: {
            id: String(user.id),
            name: String(user.name),
            email: String(user.email).toLowerCase(),
            role: String(user.role).toLowerCase(),
        },
        metadata: {
            ip: normalizeIp(ip),
            userAgent: normalizeUserAgent(userAgent),
        },
        createdAt: now,
    };

    await db.collection(COLLECTION_NAME).doc(payload.id).set(payload);

    return {
        id: payload.id,
        createdAt: payload.createdAt,
    };
};

module.exports = {
    saveFeedback,
};
