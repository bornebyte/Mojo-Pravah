const crypto = require("crypto");
const { requireFirestore } = require("../firebase");

const COLLECTION_NAME = "users";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const sanitizeRole = (role) => {
    const normalizedRole = String(role || "viewer").trim().toLowerCase();
    return normalizedRole === "admin" ? "admin" : "viewer";
};

const sanitizeName = (name) => {
    const normalized = String(name || "").trim();
    if (!normalized || normalized.length > 60) {
        throw new Error("Name is required and must be at most 60 characters");
    }

    return normalized;
};

const toSafeUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
});

const getUsersCollection = () => requireFirestore().collection(COLLECTION_NAME);

const buildUserDocId = (normalizedEmail) => {
    return `user_${crypto.createHash("sha256").update(normalizedEmail).digest("hex")}`;
};

const getUserDocByEmail = async (email) => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return null;

    const snapshot = await getUsersCollection().where("email", "==", normalizedEmail).limit(1).get();
    if (snapshot.empty) return null;

    return snapshot.docs[0].data();
};

const findUserByEmail = async (email) => {
    const user = await getUserDocByEmail(email);
    return user || null;
};

const upsertGoogleUser = async ({ email, name, firebaseUid, photoUrl = "" }) => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
        throw new Error("Valid email is required");
    }

    const normalizedName = sanitizeName(name || normalizedEmail.split("@")[0] || "Viewer");
    const now = new Date().toISOString();
    const deterministicId = buildUserDocId(normalizedEmail);
    const deterministicRef = getUsersCollection().doc(deterministicId);
    const deterministicDoc = await deterministicRef.get();

    if (deterministicDoc.exists) {
        const existing = deterministicDoc.data();
        const merged = {
            ...existing,
            id: existing.id || deterministicId,
            email: normalizedEmail,
            role: sanitizeRole(existing.role),
            name: normalizedName,
            firebaseUid: firebaseUid || existing.firebaseUid || "",
            photoUrl: String(photoUrl || existing.photoUrl || ""),
            authProvider: "google",
            updatedAt: now,
            lastLoginAt: now,
        };

        await deterministicRef.set(merged, { merge: true });
        return toSafeUser(merged);
    }

    const existingUser = await getUserDocByEmail(normalizedEmail);

    if (existingUser) {
        const merged = {
            ...existingUser,
            id: existingUser.id || deterministicId,
            role: sanitizeRole(existingUser.role),
            name: normalizedName,
            firebaseUid: firebaseUid || existingUser.firebaseUid || "",
            photoUrl: String(photoUrl || existingUser.photoUrl || ""),
            authProvider: "google",
            updatedAt: now,
            lastLoginAt: now,
        };

        await getUsersCollection().doc(existingUser.id).set(merged, { merge: true });
        // Backfill deterministic email-based doc for future conflict-free upserts.
        await deterministicRef.set(merged, { merge: true });
        return toSafeUser(merged);
    }

    const user = {
        id: deterministicId,
        name: normalizedName,
        email: normalizedEmail,
        role: "viewer",
        firebaseUid: String(firebaseUid || ""),
        photoUrl: String(photoUrl || ""),
        authProvider: "google",
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
    };

    await deterministicRef.set(user);
    return toSafeUser(user);
};

const sanitizeUser = (user) => toSafeUser(user);

const seedUsers = async () => {
    // No-op: users are created on first Google sign-in.
};

const listUsers = async () => {
    const snapshot = await getUsersCollection().orderBy("createdAt", "asc").get();
    return snapshot.docs.map((doc) => sanitizeUser(doc.data()));
};

module.exports = {
    findUserByEmail,
    upsertGoogleUser,
    sanitizeUser,
    listUsers,
    seedUsers,
};
