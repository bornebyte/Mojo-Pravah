import { Navigate } from "react-router-dom";
import { useState } from "react";
import api from "../api";
import BrandBanner from "../components/BrandBanner";
import { firebaseApp } from "../firebase";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const LoginPage = ({ onAuthSuccess, user }) => {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

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
            const result = await signInWithPopup(firebaseAuth, provider);
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
                <p className="subtext">
                    Sign in with Google. First login creates your account as viewer by default.
                </p>

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
