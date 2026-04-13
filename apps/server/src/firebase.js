const admin = require("firebase-admin");
const config = require("./config");

const normalizePrivateKey = (value) => {
    if (!value) return "";
    return value.replace(/\\n/g, "\n").trim();
};

let firestore = null;
let firebaseInitError = "";
const normalizedPrivateKey = normalizePrivateKey(config.firebasePrivateKey);
const normalizedServiceAccountJson = String(config.firebaseServiceAccountJson || "").trim();

const initWithServiceAccountCert = () => {
    const credential = admin.credential.cert({
        projectId: config.firebaseProjectId,
        clientEmail: config.firebaseClientEmail,
        privateKey: normalizedPrivateKey,
    });

    admin.initializeApp({
        credential,
        databaseURL: config.firebaseDatabaseUrl || undefined,
    });
};

const initWithServiceAccountJson = () => {
    const parsed = JSON.parse(normalizedServiceAccountJson);
    const privateKey = normalizePrivateKey(parsed.private_key);

    if (!parsed.project_id || !parsed.client_email || !privateKey) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is missing required fields");
    }

    const credential = admin.credential.cert({
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey,
    });

    admin.initializeApp({
        credential,
        databaseURL: config.firebaseDatabaseUrl || parsed.database_url || undefined,
    });
};

const initWithApplicationDefault = () => {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: config.firebaseProjectId || undefined,
        databaseURL: config.firebaseDatabaseUrl || undefined,
    });
};

const canInitFirebase =
    Boolean(config.firebaseProjectId) &&
    Boolean(config.firebaseClientEmail) &&
    Boolean(normalizedPrivateKey);

const canInitWithServiceAccountJson = Boolean(normalizedServiceAccountJson);
const canInitWithApplicationDefault = Boolean(config.googleApplicationCredentials);

if (canInitFirebase || canInitWithServiceAccountJson || canInitWithApplicationDefault) {
    try {
        if (!admin.apps.length) {
            if (canInitFirebase) {
                initWithServiceAccountCert();
            } else if (canInitWithServiceAccountJson) {
                initWithServiceAccountJson();
            } else {
                initWithApplicationDefault();
            }
        }

        firestore = admin.firestore();
        console.log("Firebase Admin initialized");
    } catch (error) {
        firebaseInitError = error.message;
        console.error("Failed to initialize Firebase Admin", error);
    }
} else {
    firebaseInitError =
        "Firebase Admin disabled: provide FIREBASE_SERVICE_ACCOUNT_JSON, or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY, or GOOGLE_APPLICATION_CREDENTIALS";

    if (config.isProduction) {
        console.warn(firebaseInitError);
    } else {
        console.log("Firebase Admin disabled in development. Match history persistence will be unavailable.");
    }
}

const requireFirestore = () => {
    if (!firestore) {
        throw new Error(`Firebase is not configured: ${firebaseInitError}`);
    }

    return firestore;
};

module.exports = {
    admin,
    firestore,
    requireFirestore,
};
