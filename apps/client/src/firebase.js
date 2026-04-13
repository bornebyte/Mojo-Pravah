import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

const readEnv = (key) => {
    const value = import.meta.env[key];
    return typeof value === "string" ? value.trim() : "";
};

const firebaseConfig = {
    apiKey: readEnv("VITE_FIREBASE_API_KEY"),
    authDomain: readEnv("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: readEnv("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: readEnv("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: readEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: readEnv("VITE_FIREBASE_APP_ID"),
    measurementId: readEnv("VITE_FIREBASE_MEASUREMENT_ID"),
};

const requiredConfigKeys = [
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId",
];

const missingFirebaseConfigKeys = requiredConfigKeys.filter(
    (key) => !firebaseConfig[key]
);

const canInitializeFirebase = missingFirebaseConfigKeys.length === 0;

let firebaseApp = null;
let firebaseAnalytics = null;
let firebaseInitError = "";

if (canInitializeFirebase) {
    try {
        firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
    } catch (error) {
        firebaseInitError = error instanceof Error ? error.message : String(error);
        console.error("Failed to initialize Firebase app", error);
    }
} else {
    firebaseInitError = `Missing Firebase config keys: ${missingFirebaseConfigKeys.join(", ")}`;

    if (import.meta.env.DEV) {
        console.warn(firebaseInitError);
    }
}

export const initializeFirebaseAnalytics = async () => {
    if (!firebaseApp || !firebaseConfig.measurementId) {
        return null;
    }

    if (typeof window === "undefined") {
        return null;
    }

    try {
        const analyticsSupported = await isSupported();
        if (!analyticsSupported) {
            return null;
        }

        firebaseAnalytics = getAnalytics(firebaseApp);
        return firebaseAnalytics;
    } catch (error) {
        if (import.meta.env.DEV) {
            console.warn("Firebase Analytics is unavailable in this environment", error);
        }
        return null;
    }
};

void initializeFirebaseAnalytics();

export {
    firebaseApp,
    firebaseAnalytics,
    firebaseConfig,
    canInitializeFirebase,
    missingFirebaseConfigKeys,
    firebaseInitError,
};
