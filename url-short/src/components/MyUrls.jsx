import React, { useState, useEffect } from "react";
import "./MyUrls.css";

function MyUrls() {
    const [urls, setUrls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notLoggedIn, setNotLoggedIn] = useState(false);
    const [visibleQr, setVisibleQr] = useState(null);
    const [qrData, setQrData] = useState({});

    useEffect(() => {
        const fetchUrls = async () => {
            try {
                const response = await fetch("/my-urls", {
                    credentials: "include",
                });

                console.log("Response status:", response.status); // Debug 
                console.log("Response ok:", response.ok); // Debug

                if (response.ok) {
                    const data = await response.json();
                    console.log("Fetched URLs:", data); // Debug
                    setUrls(data);
                } else if (response.status === 401) {
                    console.log("User not authenticated"); // Debug
                    setNotLoggedIn(true);
                } else {
                    setError("Failed to load URLs");
                }
            } catch (err) {
                console.error("Error:", err);
                setError("Could not load your URLs");
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
        if (qrData[shortCode]) {
            setVisibleQr(shortCode);
            return;
        }

        try {
            const response = await fetch(`/qr/${shortCode}`);
            if (response.ok) {
                const data = await response.json();
                setQrData(prev => ({ ...prev, [shortCode]: data.qr_code }));
                setVisibleQr(shortCode);
            }
        } catch (err) {
            console.error("Failed to load QR code:", err);
        }
    };

    const handleCloseQr = () => {
        setVisibleQr(null);
    };

    const handleSaveQr = (shortCode) => {
        const qrCode = qrData[shortCode];
        if (!qrCode) return;
        
        const link = document.createElement("a");
        link.href = `data:image/png;base64,${qrCode}`;
        link.download = `qr-${shortCode}.png`;
        link.click();
    };

    const handleCopyQr = async (shortCode) => {
        const qrCode = qrData[shortCode];
        if (!qrCode) return;
        
        try {
            const res = await fetch(`data:image/png;base64,${qrCode}`);
            const blob = await res.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob }),
            ]);
        } catch (err) {
            console.error("Failed to copy QR code:", err);
        }
    };

    const handleDeleteUrl = async (shortCode) => {
        try {
            const response = await fetch(`/delete/${shortCode}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                setUrls(prevUrls => prevUrls.filter(url => url.short_code !== shortCode));
                setQrData(prev => {
                    const { [shortCode]: _, ...rest } = prev;
                    return rest;
                });
            } else {
                console.error('Failed to delete URL');
            }
        } catch (err) {
            console.error('Error deleting URL:', err);
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
                {notLoggedIn ? (
                    <p className="myurls-empty">Please login to view your links.</p>
                ) : urls.length === 0 && !error ? (
                    <p className="myurls-empty">No links created yet.</p>
                ) : (
                    <ul className="myurls-list">
                        {urls.map((item, index) => (
                            <li key={index} className="myurls-item">
                                <button
                                    className="myurls-delete-btn"
                                    onClick={() => handleDeleteUrl(item.short_code)}
                                    title="Delete this link"
                                >
                                    ×
                                </button>
                                <div className="myurls-content">
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
                                                Show QR
                                            </button>
                                            <button
                                                className="myurls-copy-btn"
                                                onClick={() => handleCopy(item.short_code)}
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            
            {/* QR Code Overlay */}
            {visibleQr && qrData[visibleQr] && (
                <div className="myurls-qr-overlay">
                    <div className="myurls-qr-modal">
                        <button className="myurls-qr-close" onClick={handleCloseQr}>
                            ×
                        </button>
                        <h3 className="myurls-qr-title">QR Code</h3>
                        <img
                            className="myurls-qr-image"
                            src={`data:image/png;base64,${qrData[visibleQr]}`}
                            alt="QR Code"
                        />
                        <div className="myurls-qr-actions">
                            <button
                                className="myurls-qr-btn"
                                onClick={() => handleSaveQr(visibleQr)}
                            >
                                Save QR
                            </button>
                            <button
                                className="myurls-qr-btn"
                                onClick={() => handleCopyQr(visibleQr)}
                            >
                                Copy QR
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyUrls;
