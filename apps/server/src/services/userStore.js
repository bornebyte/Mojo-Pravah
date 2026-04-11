const bcrypt = require("bcryptjs");

const usersByEmail = new Map();
let idSequence = 1;

const createUser = async ({ name, email, password, role = "viewer" }) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (usersByEmail.has(normalizedEmail)) {
        throw new Error("User already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
        id: idSequence++,
        name: name.trim(),
        email: normalizedEmail,
        role,
        passwordHash,
    };

    usersByEmail.set(normalizedEmail, user);
    return { ...user, passwordHash: undefined };
};

const findUserByEmail = (email) => {
    const normalizedEmail = email.trim().toLowerCase();
    return usersByEmail.get(normalizedEmail);
};

const verifyPassword = async (user, password) => bcrypt.compare(password, user.passwordHash);

const sanitizeUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
});

const seedUsers = async () => {
    if (!findUserByEmail("admin@volley.local")) {
        await createUser({
            name: "Admin",
            email: "admin@volley.local",
            password: "Admin@123",
            role: "admin",
        });
    }

    if (!findUserByEmail("viewer@volley.local")) {
        await createUser({
            name: "Viewer",
            email: "viewer@volley.local",
            password: "Viewer@123",
            role: "viewer",
        });
    }
};

const listUsers = () => Array.from(usersByEmail.values()).map(sanitizeUser);

module.exports = {
    createUser,
    findUserByEmail,
    verifyPassword,
    sanitizeUser,
    listUsers,
    seedUsers,
};
