import React, { useState } from "react";
import "./Hero.css";
import logo from "../assets/lnksy-high-resolution-logo-transparent.png";
import { saveQrCode, copyQrCode } from "../utils/qrUtils";
import { shortenUrl } from "../api";

function Hero({ onViewMyLinks, showMyUrls, onShowLogin, currentUser, onLogout }) {
    const [url, setUrl] = useState("");
    const [shortUrl, setShortUrl] = useState("");
    const [qrCode, setQrCode] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setShortUrl(""); 

        try {
            const data = await shortenUrl(url);
            setShortUrl(data.short_url);
            setQrCode(data.qr_code);
        } catch (err) {
            console.error("Error:", err);
            setError(err.message || "Failed to connect to the server");
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(shortUrl);
    };

    const handleSaveQr = () => {
        saveQrCode(qrCode);
    };

    const handleCopyQr = async () => {
        try {
            await copyQrCode(qrCode);
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
            {/* Top-right auth section */}
            <div className="hero-auth-corner">
                {currentUser ? (
                    <div className="hero-user-info">
                        <span className="hero-user-email">{currentUser}</span>
                        <button className="hero-logout-btn" onClick={() => {
                            setUrl("");
                            setShortUrl("");
                            setQrCode("");
                            setError("");
                            onLogout();
                        }}>
                            Logout
                        </button>
                    </div>
                ) : (
                    <button className="hero-login-btn" onClick={onShowLogin}>
                        Login / Register
                    </button>
                )}
            </div>
            
            <div className={`hero-card ${shortUrl ? 'hero-card--has-result' : ''}`}>
                <div className={`hero-left ${shortUrl ? 'hero-left--has-result' : ''}`}>
                    <img src={logo} alt="Linksy" className="hero-logo" />
                    <p className="hero-subtitle">Share Smarter.</p>
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