const dotenv = require("dotenv");

dotenv.config();

const parseNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const parseOrigins = (value) => {
    const fallback = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ];

    const rawOrigins = (value || fallback.join(","))
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    return Array.from(
        new Set(
            rawOrigins.map((origin) => {
                try {
                    const url = new URL(origin);
                    return `${url.protocol}//${url.host}`;
                } catch {
                    return origin.replace(/\/+$/, "");
                }
            })
        )
    );
};

const normalizeOrigin = (origin) => {
    if (!origin) return "";

    try {
        const url = new URL(origin);
        return `${url.protocol}//${url.host}`;
    } catch {
        return String(origin).trim().replace(/\/+$/, "");
    }
};

const createCorsOriginValidator = (allowedOrigins, { isProduction }) => {
    const normalizedAllowed = new Set(allowedOrigins.map(normalizeOrigin));

    return (origin, callback) => {
        // Allow non-browser and same-origin requests that do not send Origin.
        if (!origin) {
            callback(null, true);
            return;
        }

        const normalizedOrigin = normalizeOrigin(origin);
        const isLocalDevOrigin =
            !isProduction &&
            /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalizedOrigin);

        if (normalizedAllowed.has(normalizedOrigin) || isLocalDevOrigin) {
            callback(null, true);
            return;
        }

        callback(new Error(`CORS blocked for origin: ${origin}`));
    };
};

const isProduction = process.env.NODE_ENV === "production";
const jwtSecret = process.env.JWT_SECRET || "replace-this-in-production";
const clientOrigins = parseOrigins(process.env.CLIENT_ORIGIN);

if (isProduction && jwtSecret === "replace-this-in-production") {
    throw new Error("JWT_SECRET must be set in production");
}

module.exports = {
    port: parseNumber(process.env.PORT, 4000),
    clientOrigins,
    isCorsOriginAllowed: createCorsOriginValidator(clientOrigins, { isProduction }),
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
    useRedisAdapter: process.env.USE_REDIS_ADAPTER === "true",
    redisUrl: process.env.REDIS_URL || "redis://127.0.0.1:6379",
    isProduction,
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "",
    firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY || "",
    firebaseDatabaseUrl: process.env.FIREBASE_DATABASE_URL || "",
    firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "",
    googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS || "",
};
