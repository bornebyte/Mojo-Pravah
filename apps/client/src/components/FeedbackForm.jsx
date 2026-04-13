import { useState } from "react";
import api from "../api";

const STAR_VALUES = [1, 2, 3, 4, 5];

const FeedbackForm = ({ page }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const submitFeedback = async (event) => {
        event.preventDefault();
        setLoading(true);
        setSuccess("");
        setError("");

        try {
            await api.post("/feedback", {
                rating,
                comment,
                page,
            });

            setComment("");
            setRating(5);
            setSuccess("Thanks! Your feedback has been saved.");
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Failed to submit feedback");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="panel feedback-panel" aria-label="Feedback form">
            <h3>Share Feedback</h3>
            <p className="helper">Rate your experience and leave a short comment.</p>

            <form onSubmit={submitFeedback} className="auth-form">
                <fieldset className="star-fieldset">
                    <legend>Rating</legend>
                    <div className="star-row" role="radiogroup" aria-label="Rating out of five stars">
                        {STAR_VALUES.map((value) => (
                            <button
                                key={value}
                                type="button"
                                className={value <= rating ? "star-btn active" : "star-btn"}
                                onClick={() => setRating(value)}
                                aria-label={`${value} star${value > 1 ? "s" : ""}`}
                                aria-pressed={value === rating}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                </fieldset>

                <label>
                    Comment
                    <textarea
                        value={comment}
                        maxLength={500}
                        minLength={3}
                        onChange={(event) => setComment(event.target.value)}
                        placeholder="Tell us what worked well or what can be improved"
                        required
                    />
                </label>

                {success ? <p className="helper success-text">{success}</p> : null}
                {error ? <p className="error-text">{error}</p> : null}

                <button type="submit" className="cta" disabled={loading}>
                    {loading ? "Submitting..." : "Submit Feedback"}
                </button>
            </form>
        </section>
    );
};

export default FeedbackForm;
