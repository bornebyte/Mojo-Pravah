import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";
import BrandBanner from "../components/BrandBanner";
import { firebaseApp } from "../firebase";
import {
    getAuth,
    getRedirectResult,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    signOut,
} from "firebase/auth";

const LoginPage = ({ onAuthSuccess, user }) => {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const resolveRedirectLogin = async () => {
            if (!firebaseApp) return;

            try {
                setLoading(true);
                const firebaseAuth = getAuth(firebaseApp);
                const redirectResult = await getRedirectResult(firebaseAuth);

                if (!redirectResult?.user || !isMounted) return;

                const idToken = await redirectResult.user.getIdToken();
                const { data } = await api.post("/auth/google", { idToken });
                onAuthSuccess(data);
                await signOut(firebaseAuth);
            } catch (requestError) {
                if (!isMounted) return;
                setError(requestError.response?.data?.message || requestError.message || "Google login failed");
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        resolveRedirectLogin();

        return () => {
            isMounted = false;
        };
    }, [onAuthSuccess]);

    if (user) {
        return <Navigate to={user.role === "admin" ? "/admin" : "/viewer"} replace />;
    }

    const onGoogleLogin = async () => {
        setError("");
        setLoading(true);

        try {
            if (!firebaseApp) {
                throw new Error("Firebase web app is not configured");
            }

            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: "select_account" });

            const firebaseAuth = getAuth(firebaseApp);
            let result;

            try {
                result = await signInWithPopup(firebaseAuth, provider);
            } catch (popupError) {
                const code = String(popupError?.code || "");
                const shouldFallbackToRedirect =
                    code.includes("popup-blocked") ||
                    code.includes("popup-closed-by-user") ||
                    code.includes("operation-not-supported-in-this-environment");

                if (!shouldFallbackToRedirect) {
                    throw popupError;
                }

                await signInWithRedirect(firebaseAuth, provider);
                return;
            }

            const idToken = await result.user.getIdToken();

            const { data } = await api.post("/auth/google", { idToken });
            onAuthSuccess(data);

            // Keep backend JWT as source of truth for app session.
            await signOut(firebaseAuth);
        } catch (requestError) {
            setError(requestError.response?.data?.message || requestError.message || "Google login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="screen login-screen">
            <section className="panel auth-panel">
                <BrandBanner
                    title="Mojo Pravah"
                    subtitle="Live volleyball scoreboard for the Mojo hostel event"
                />
                <p className="helper">
                    If popup is blocked, we automatically continue with redirect login.
                </p>
                <br />

                <div className="auth-form">
                    {error ? <p className="error-text">{error}</p> : null}

                    <button type="button" disabled={loading} className="cta" onClick={onGoogleLogin}>
                        {loading ? "Please wait..." : "Continue with Google"}
                    </button>
                </div>

            </section>
        </main>
    );
};

export default LoginPage;
