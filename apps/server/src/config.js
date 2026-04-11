const dotenv = require("dotenv");

dotenv.config();

const parseNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const parseOrigins = (value) => {
    if (!value) {
        return ["http://localhost:5173"];
    }

    return value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
};

const isProduction = process.env.NODE_ENV === "production";
const jwtSecret = process.env.JWT_SECRET || "replace-this-in-production";

if (isProduction && jwtSecret === "replace-this-in-production") {
    throw new Error("JWT_SECRET must be set in production");
}

module.exports = {
    port: parseNumber(process.env.PORT, 4000),
    clientOrigins: parseOrigins(process.env.CLIENT_ORIGIN),
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
    useRedisAdapter: process.env.USE_REDIS_ADAPTER === "true",
    redisUrl: process.env.REDIS_URL || "redis://127.0.0.1:6379",
    isProduction,
};
