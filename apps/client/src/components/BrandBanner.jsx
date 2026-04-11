const BrandBanner = ({ title, subtitle }) => {
    return (
        <div className="brand-banner">
            <img src="/Mojo-logo.png" alt="Mojo Pravah" className="brand-logo" />
            <div>
                <p className="event-chip">Hostel Event</p>
                <h1 className="brand-title">{title}</h1>
                <p className="brand-subtitle">{subtitle}</p>
            </div>
        </div>
    );
};

export default BrandBanner;
