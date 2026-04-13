const DeveloperInfo = () => {
    return (
        <section className="panel developer-panel" aria-label="Developer information">
            <div className="developer-card">
                <img src="/shubham.jpg" alt="Shubham Shah" className="developer-avatar" />
                <div>
                    <p className="event-chip">Developer</p>
                    <h3 className="developer-name">Shubham Shah (bornebyte)</h3>
                    <p className="developer-country">Nepal 🇳🇵</p>
                    <div className="developer-links">
                        <a
                            href="https://github.com/bornebyte"
                            target="_blank"
                            rel="noreferrer"
                            className="developer-icon-link"
                            aria-label="GitHub profile"
                            title="GitHub"
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                <path
                                    fill="currentColor"
                                    d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.3-1.2-1.7-1.2-1.7-1-.7.1-.7.1-.7 1 .1 1.6 1.1 1.6 1.1 1 .1 1.8.9 2.2 1.4.9.6 2.2.4 2.8.3.1-.6.4-1.1.8-1.4-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.1-3.3-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.4 1.1 1-.3 2-.4 3-.4s2 .1 3 .4c2.4-1.4 3.4-1.1 3.4-1.1.7 1.6.3 2.8.2 3.1.7.9 1.1 2 1.1 3.3 0 4.7-2.8 5.7-5.5 6 .4.3.8 1 .8 2.1v3.1c0 .3.2.7.8.6A12 12 0 0 0 12 .5"
                                />
                            </svg>
                        </a>
                        <a
                            href="mailto:shahshubham1888@gmail.com"
                            className="developer-icon-link"
                            aria-label="Send email"
                            title="Email"
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                <path
                                    fill="currentColor"
                                    d="M4 5h16c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H4a2 2 0 0 1-2-2V7c0-1.1.9-2 2-2m0 2v.5l8 5 8-5V7l-8 5-8-5M4 17h16V9.8l-8 5-8-5z"
                                />
                            </svg>
                        </a>
                        <a
                            href="http://instagram.com/bornebyte"
                            target="_blank"
                            rel="noreferrer"
                            className="developer-icon-link"
                            aria-label="Instagram profile"
                            title="Instagram"
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                <path
                                    fill="currentColor"
                                    d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4zm9.8 1.5a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6"
                                />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DeveloperInfo;
