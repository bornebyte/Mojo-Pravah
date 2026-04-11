const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const Redis = require("ioredis");
const config = require("./config");
const { verifyToken } = require("./utils/token");

const onlineByEmail = new Map();

const addOnlineUser = (email, socketId) => {
    const normalizedEmail = email.toLowerCase();
    const socketIds = onlineByEmail.get(normalizedEmail) || new Set();
    socketIds.add(socketId);
    onlineByEmail.set(normalizedEmail, socketIds);
};

const removeOnlineUser = (email, socketId) => {
    const normalizedEmail = email.toLowerCase();
    const socketIds = onlineByEmail.get(normalizedEmail);
    if (!socketIds) return;

    socketIds.delete(socketId);
    if (!socketIds.size) {
        onlineByEmail.delete(normalizedEmail);
    }
};

const getPresenceSummary = () => {
    const users = {};
    let totalConnections = 0;

    for (const [email, socketIds] of onlineByEmail.entries()) {
        users[email] = socketIds.size;
        totalConnections += socketIds.size;
    }

    return {
        onlineUsers: Object.keys(users).length,
        totalConnections,
        users,
    };
};

const emitPresence = (io) => {
    io.emit("presence:count", getPresenceSummary());
};

const setupSocket = async (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: config.clientOrigins,
            methods: ["GET", "POST", "PATCH"],
        },
        transports: ["websocket", "polling"],
        pingTimeout: 20000,
        pingInterval: 25000,
        connectionStateRecovery: {
            maxDisconnectionDuration: 2 * 60 * 1000,
        },
    });

    if (config.useRedisAdapter) {
        const pubClient = new Redis(config.redisUrl, { lazyConnect: true });
        const subClient = pubClient.duplicate();
        await Promise.all([pubClient.connect(), subClient.connect()]);
        io.adapter(createAdapter(pubClient, subClient));
        console.log("Socket.IO Redis adapter enabled");
    }

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error("Authentication token required"));
        }

        try {
            socket.user = verifyToken(token);
            return next();
        } catch {
            return next(new Error("Invalid token"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id} (${socket.user.email})`);
        addOnlineUser(socket.user.email, socket.id);
        emitPresence(io);

        socket.on("disconnect", (reason) => {
            removeOnlineUser(socket.user.email, socket.id);
            emitPresence(io);
            console.log(`Socket disconnected: ${socket.id} (${reason})`);
        });
    });

    return io;
};

module.exports = {
    setupSocket,
    getPresenceSummary,
};
