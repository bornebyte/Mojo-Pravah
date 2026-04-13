const http = require("http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const config = require("./config");
const { admin } = require("./firebase");
const { setupSocket, getPresenceSummary } = require("./socket");
const { upsertGoogleUser, listUsers, seedUsers } = require("./services/userStore");
const { getMatchState, updateScore, resetMatch, updateTeamNames, updateSetInfo } = require("./services/scoreStore");
const { allowedStages, listMatches, saveMatch, updateMatch } = require("./services/matchHistoryStore");
const { signToken } = require("./utils/token");
const { requireAuth, requireAdmin } = require("./middleware/auth");

const app = express();

// Behind Caddy/Cloudflare in production, trust first proxy hop for real client IP.
app.set("trust proxy", config.isProduction ? 1 : false);

app.use(helmet());
app.use(
    cors({
        origin: config.isCorsOriginAllowed,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
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
let httpServer;

app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
});

app.post("/api/auth/register", (_req, res) => {
    return res.status(410).json({ message: "Registration moved to Google sign-in" });
});

app.post("/api/auth/login", (_req, res) => {
    return res.status(410).json({ message: "Password login is disabled. Use Google sign-in." });
});

app.post("/api/auth/google", async (req, res) => {
    const { idToken } = req.body || {};
    if (!idToken) {
        return res.status(400).json({ message: "Google idToken is required" });
    }

    try {
        if (!admin.apps.length) {
            return res.status(500).json({ message: "Firebase Admin is not configured" });
        }

        const decoded = await admin.auth().verifyIdToken(String(idToken));
        const provider = decoded.firebase?.sign_in_provider || "";
        const email = String(decoded.email || "").trim().toLowerCase();
        const name = String(decoded.name || "").trim();
        const emailVerified = Boolean(decoded.email_verified);

        if (!email) {
            return res.status(400).json({ message: "Google account email is required" });
        }

        if (!emailVerified) {
            return res.status(403).json({ message: "Google account email must be verified" });
        }

        if (provider && provider !== "google.com") {
            return res.status(403).json({ message: "Only Google sign-in is allowed" });
        }

        const user = await upsertGoogleUser({
            email,
            name: name || email,
            firebaseUid: decoded.uid,
            photoUrl: decoded.picture || "",
        });

        const token = signToken(user);
        return res.json({ user, token });
    } catch (error) {
        const message = error?.message || "Invalid Google sign-in token";
        const isAuthError = /id token|token|auth|expired|invalid/i.test(message);
        return res.status(isAuthError ? 401 : 500).json({ message });
    }
});

app.get("/api/match/current", requireAuth, (_req, res) => {
    return res.json(getMatchState());
});

app.get("/api/match/history", requireAuth, async (_req, res) => {
    try {
        const matches = await listMatches();
        return res.json({ matches, allowedStages });
    } catch (error) {
        return res.status(500).json({ message: error.message || "Failed to load match history" });
    }
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

app.patch("/api/match/set-info", requireAuth, requireAdmin, (req, res) => {
    const { set, liveLabel } = req.body;

    try {
        const state = updateSetInfo({ set, liveLabel });
        io.emit("score:update", state);
        return res.json(state);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
});

app.post("/api/match/history", requireAuth, requireAdmin, async (req, res) => {
    const { stage, isConfirmed, notes = "" } = req.body;
    if (!isConfirmed) {
        return res.status(400).json({ message: "Please confirm match finalization before saving" });
    }

    try {
        const payload = await saveMatch({
            stage,
            notes,
            matchState: getMatchState(),
            updatedBy: req.user.email,
        });

        io.emit("history:update");
        return res.status(201).json(payload);
    } catch (error) {
        return res.status(400).json({ message: error.message || "Failed to save match" });
    }
});

app.put("/api/match/history/:id", requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const payload = await updateMatch(id, {
            ...req.body,
            updatedBy: req.user.email,
        });

        io.emit("history:update");
        return res.json(payload);
    } catch (error) {
        const notFound = error.message === "Match record not found";
        return res.status(notFound ? 404 : 400).json({ message: error.message || "Failed to update match" });
    }
});

app.get("/api/admin/users", requireAuth, requireAdmin, async (_req, res) => {
    try {
        const users = await listUsers();
        const presence = getPresenceSummary();

        const payload = users.map((user) => ({
            ...user,
            online: Boolean(presence.users[user.email]),
            socketConnections: presence.users[user.email] || 0,
        }));

        return res.json({
            users: payload,
            onlineUsers: presence.onlineUsers,
            totalConnections: presence.totalConnections,
            updatedAt: new Date().toISOString(),
        });
    } catch (error) {
        return res.status(500).json({ message: error.message || "Failed to load users" });
    }
});

const boot = async () => {
    await seedUsers();

    httpServer = http.createServer(app);
    io = await setupSocket(httpServer);

    httpServer.listen(config.port, () => {
        console.log(`Server running on port ${config.port}`);
    });
};

const shutdown = (signal) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);

    if (!httpServer) {
        process.exit(0);
        return;
    }

    httpServer.close((error) => {
        if (error) {
            console.error("Error while closing HTTP server", error);
            process.exit(1);
            return;
        }

        process.exit(0);
    });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

boot().catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
});
