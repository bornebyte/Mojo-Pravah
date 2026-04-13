import { Navigate } from "react-router-dom";
import { useState } from "react";
import api from "../api";
import BrandBanner from "../components/BrandBanner";

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
                <BrandBanner
                    title="Mojo Pravah"
                    subtitle="Live volleyball scoreboard for the Mojo hostel event"
                />
                <p className="subtext">
                    Sign in to watch live updates or register as a new viewer.
                </p>

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
                        <input name="password" type="password" value={form.password} onChange={onChange} required minLength={4} placeholder="At least 4 characters" />
                    </label>

                    {error ? <p className="error-text">{error}</p> : null}

                    <button type="submit" disabled={loading} className="cta">
                        {loading ? "Please wait..." : isRegistering ? "Create viewer account" : "Sign in"}
                    </button>
                </form>
                <br />

                <button type="button" className="ghost" onClick={() => setIsRegistering((prev) => !prev)}>
                    {isRegistering ? "Already have an account? Sign in" : "New viewer? Register now"}
                </button>

            </section>
        </main>
    );
};

export default LoginPage;
