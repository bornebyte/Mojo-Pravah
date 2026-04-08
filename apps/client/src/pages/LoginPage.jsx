import { Navigate } from "react-router-dom";
import { useState } from "react";
import api from "../api";

const initialForm = { name: "", email: "", password: "" };

const LoginPage = ({ onAuthSuccess, user }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [form, setForm] = useState(initialForm);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (user) {
        return <Navigate to={user.role === "admin" ? "/admin" : "/viewer"} replace />;
    }

    const onChange = (event) => {
        setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    };

    const onSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const endpoint = isRegistering ? "/auth/register" : "/auth/login";
            const payload = isRegistering ? form : { email: form.email, password: form.password };
            const { data } = await api.post(endpoint, payload);
            onAuthSuccess(data);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Request failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="screen login-screen">
            <section className="panel auth-panel">
                <p className="eyebrow">Live Volley Arena</p>
                <h1>Real-time match scoreboard</h1>
                <p className="subtext">Every viewer must sign in before seeing live points.</p>

                <form onSubmit={onSubmit} className="auth-form">
                    {isRegistering ? (
                        <label>
                            Name
                            <input name="name" value={form.name} onChange={onChange} required placeholder="Your name" />
                        </label>
                    ) : null}

                    <label>
                        Email
                        <input name="email" type="email" value={form.email} onChange={onChange} required placeholder="you@example.com" />
                    </label>

                    <label>
                        Password
                        <input name="password" type="password" value={form.password} onChange={onChange} required minLength={8} placeholder="At least 8 characters" />
                    </label>

                    {error ? <p className="error-text">{error}</p> : null}

                    <button type="submit" disabled={loading} className="cta">
                        {loading ? "Please wait..." : isRegistering ? "Create viewer account" : "Sign in"}
                    </button>
                </form>

                <button type="button" className="ghost" onClick={() => setIsRegistering((prev) => !prev)}>
                    {isRegistering ? "Already have an account? Sign in" : "New viewer? Register now"}
                </button>

                <p className="helper">Demo admin login: admin@volley.local / Admin@123</p>
            </section>
        </main>
    );
};

export default LoginPage;
