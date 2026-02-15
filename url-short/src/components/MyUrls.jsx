import React, { useState, useEffect } from "react";
import "./MyUrls.css";

function MyUrls() {
    const [urls, setUrls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [visibleQr, setVisibleQr] = useState(null);
    const [qrData, setQrData] = useState({});

    useEffect(() => {
        const fetchUrls = async () => {
            const sessionId = localStorage.getItem("session_id");
            // if (!sessionId) {
            //     setUrls([]);
            //     setLoading(false);
            //     return;
            // }

            try {
                const response = await fetch("http://127.0.0.1:5001/my-urls", {
                    headers: {
                        "X-Session-ID": sessionId,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setUrls(data);
                } else if (response.status === 401) {
                    setUrls([]);
                } else {
                    setError("Failed to load URLs");
                }
            } catch (err) {
                console.error("Error:", err);
                setError("Could not retrieve X-Session-ID");
            } finally {
                setLoading(false);
            }
        };

        fetchUrls();
    }, []);

    const handleCopy = (shortCode) => {
        navigator.clipboard.writeText(`http://127.0.0.1:5001/${shortCode}`);
    };

    const handleShowQr = async (shortCode) => {
        if (visibleQr === shortCode) {
            setVisibleQr(null);
            return;
        }

        if (qrData[shortCode]) {
            setVisibleQr(shortCode);
            return;
        }

        try {
            const response = await fetch(`http://127.0.0.1:5001/qr/${shortCode}`);
            if (response.ok) {
                const data = await response.json();
                setQrData(prev => ({ ...prev, [shortCode]: data.qr_code }));
                setVisibleQr(shortCode);
            }
        } catch (err) {
            console.error("Failed to load QR code:", err);
        }
    };

    if (loading) {
        return (
            <div className="myurls-wrapper">
                <p className="myurls-loading">Loading...</p>
            </div>
        );
    }

    return (
        <div className="myurls-wrapper">
            <div className="myurls-card">
                <h2 className="myurls-title">My Links</h2>
                {error && <p className="myurls-error">{error}</p>}
                {urls.length === 0 && !error ? (
                    <p className="myurls-empty">No links created yet.</p>
                ) : (
                    <ul className="myurls-list">
                        {urls.map((item, index) => (
                            <li key={index} className="myurls-item">
                                <div className="myurls-original" title={item.original_url}>
                                    {item.original_url}
                                </div>
                                <div className="myurls-bottom">
                                    <a
                                        className="myurls-short"
                                        href={`http://127.0.0.1:5001/${item.short_code}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {`http://127.0.0.1:5001/${item.short_code}`}
                                    </a>
                                    <div className="myurls-btn-group">
                                        <button
                                            className="myurls-copy-btn"
                                            onClick={() => handleShowQr(item.short_code)}
                                        >
                                            {visibleQr === item.short_code ? 'Hide QR' : 'Show QR'}
                                        </button>
                                        <button
                                            className="myurls-copy-btn"
                                            onClick={() => handleCopy(item.short_code)}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                                {visibleQr === item.short_code && qrData[item.short_code] && (
                                    <div className="myurls-qr-container">
                                        <img
                                            className="myurls-qr"
                                            src={`data:image/png;base64,${qrData[item.short_code]}`}
                                            alt="QR Code"
                                        />
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default MyUrls;
