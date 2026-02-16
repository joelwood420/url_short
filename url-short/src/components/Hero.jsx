import React, { useState } from "react";
import "./Hero.css";

function Hero({ onViewMyLinks, showMyUrls }) {
    const [url, setUrl] = useState("");
    const [shortUrl, setShortUrl] = useState("");
    const [qrCode, setQrCode] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setShortUrl(""); 

        const sessionId = localStorage.getItem("session_id") || "";

        try {
            const response = await fetch("http://127.0.0.1:5001/shorten", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Session-ID": sessionId,
                },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();

            if (response.ok) {
                setShortUrl(data.short_url);
                setQrCode(data.qr_code);
                if (data.session_id) {
                    localStorage.setItem("session_id", data.session_id);
                }
            } else {
                setError(data.error || "Something went wrong");
            }
        } catch (err) {
            console.error("Error:", err);
            setError("Failed to connect to the server");
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(shortUrl);
    };

    const handleSaveQr = () => {
        const link = document.createElement("a");
        link.href = `data:image/png;base64,${qrCode}`;
        link.download = "qrcode.png";
        link.click();
    };

    const handleCopyQr = async () => {
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

    const handleCreateAnother = () => {
        setUrl("");
        setShortUrl("");
        setQrCode("");
        setError("");
    };

    return (
        <div className={`hero-wrapper ${showMyUrls ? 'hero-wrapper--compact' : ''}`}>
            <div className={`hero-card ${shortUrl ? 'hero-card--has-result' : ''}`}>
                <div className={`hero-left ${shortUrl ? 'hero-left--has-result' : ''}`}>
                    <h1 className="hero-logo">URL Short</h1>
                    <p className="hero-subtitle">Generate a Short Url</p>
                    <form onSubmit={handleSubmit}>
                        <input
                            className="hero-input"
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="ENTER A URL"
                        />
                        <button className="hero-button" type="submit">CREATE</button>
                    </form>
                    {error && <p className="hero-error">{error}</p>}
                    <button className="hero-mylinks-btn" onClick={onViewMyLinks}>
                        {showMyUrls ? 'Hide My Links' : 'View My Links'}
                    </button>
                    <p className="hero-footer">Created by Joel</p>
                </div>
                {shortUrl && (
                    <div className="hero-right">
                        {qrCode && (
                            <>
                                <img className="hero-qr" src={`data:image/png;base64,${qrCode}`} alt="QR Code" />
                                <div className="hero-qr-actions">
                                    <button className="hero-qr-btn" onClick={handleSaveQr}>Save QR</button>
                                    <button className="hero-qr-btn" onClick={handleCopyQr}>Copy QR</button>
                                </div>
                            </>
                        )}
                        <h2 className="hero-result-title">Your short link:</h2>
                        <a className="hero-short-link" href={shortUrl} target="_blank" rel="noopener noreferrer">
                            {shortUrl}
                        </a>
                        <div className="hero-actions">
                            <button className="hero-copy-link" onClick={handleCopy}>Copy URL</button>
                            <span className="hero-or">or</span>
                            <button className="hero-create-another" onClick={handleCreateAnother}>Create another one</button>
                        </div>
                        <p className="hero-footer hero-footer--result">Created by Joel</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Hero;