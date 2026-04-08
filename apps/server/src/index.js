const http = require("http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const config = require("./config");
const { setupSocket } = require("./socket");
const { createUser, findUserByEmail, verifyPassword, sanitizeUser, seedUsers } = require("./services/userStore");
const { getMatchState, updateScore, resetMatch, updateTeamNames } = require("./services/scoreStore");
const { signToken } = require("./utils/token");
const { requireAuth, requireAdmin } = require("./middleware/auth");

const app = express();

app.use(helmet());
app.use(
    cors({
        origin: config.clientOrigin,
        credentials: true,
    })
);
app.use(express.json());
app.use(
    rateLimit({
        windowMs: 60 * 1000,
        max: 200,
        standardHeaders: true,
        legacyHeaders: false,
    })
);

let io;

app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
});

app.post("/api/auth/register", async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 8) {
        return res.status(400).json({ message: "Name, email and password (min 8 chars) are required" });
    }

    try {
        const user = await createUser({ name, email, password, role: "viewer" });
        const token = signToken(user);
        return res.status(201).json({ user, token });
    } catch (error) {
        return res.status(409).json({ message: error.message });
    }
});

app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    const user = findUserByEmail(email);
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await verifyPassword(user, password);
    if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const safeUser = sanitizeUser(user);
    const token = signToken(safeUser);
    return res.json({ user: safeUser, token });
});

app.get("/api/match/current", requireAuth, (_req, res) => {
    return res.json(getMatchState());
});

app.patch("/api/match/score", requireAuth, requireAdmin, (req, res) => {
    const { team, delta } = req.body;
    if ((team !== "A" && team !== "B") || ![1, -1].includes(delta)) {
        return res.status(400).json({ message: "Use team=A|B and delta=1|-1" });
    }

    try {
        const state = updateScore({ team, delta });
        io.emit("score:update", state);
        return res.json(state);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
});

app.patch("/api/match/reset", requireAuth, requireAdmin, (_req, res) => {
    const state = resetMatch();
    io.emit("score:update", state);
    return res.json(state);
});

app.patch("/api/match/teams", requireAuth, requireAdmin, (req, res) => {
    const { teamAName, teamBName } = req.body;

    try {
        const state = updateTeamNames({ teamAName, teamBName });
        io.emit("score:update", state);
        return res.json(state);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
});

const boot = async () => {
    await seedUsers();

    const httpServer = http.createServer(app);
    io = await setupSocket(httpServer);

    httpServer.listen(config.port, () => {
        console.log(`Server running on port ${config.port}`);
    });
};

boot().catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
});
