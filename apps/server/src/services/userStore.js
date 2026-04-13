const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { requireFirestore } = require("../../firebase");

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

const getUserDocByEmail = async (email) => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return null;

    const snapshot = await getUsersCollection().where("email", "==", normalizedEmail).limit(1).get();
    if (snapshot.empty) return null;

    return snapshot.docs[0].data();
};

const createUser = async ({ name, email, password, role = "viewer" }) => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
        throw new Error("Valid email is required");
    }

    if (!password || password.length < 4) {
        throw new Error("Password must be at least 4 characters");
    }

    const existingUser = await getUserDocByEmail(normalizedEmail);
    if (existingUser) {
        throw new Error("User already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
        id: crypto.randomUUID(),
        name: sanitizeName(name),
        email: normalizedEmail,
        role: sanitizeRole(role),
        passwordHash,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    await getUsersCollection().doc(user.id).set(user);
    return toSafeUser(user);
};

const findUserByEmail = async (email) => {
    const user = await getUserDocByEmail(email);
    return user || null;
};

const verifyPassword = async (user, password) => bcrypt.compare(password, user.passwordHash);

const sanitizeUser = (user) => toSafeUser(user);

const seedUsers = async () => {
    const admin = await findUserByEmail("admin@volley.local");
    if (!admin) {
        await createUser({
            name: "Admin",
            email: "admin@volley.local",
            password: "Admin@123",
            role: "admin",
        });
    }

    const viewer = await findUserByEmail("viewer@volley.local");
    if (!viewer) {
        await createUser({
            name: "Viewer",
            email: "viewer@volley.local",
            password: "Viewer@123",
            role: "viewer",
        });
    }
};

const listUsers = async () => {
    const snapshot = await getUsersCollection().orderBy("createdAt", "asc").get();
    return snapshot.docs.map((doc) => sanitizeUser(doc.data()));
};

module.exports = {
    createUser,
    findUserByEmail,
    verifyPassword,
    sanitizeUser,
    listUsers,
    seedUsers,
};
