import React, { useState } from "react";
import './Hero.css'

function Hero() {
    const [url, setUrl] = useState("");
    const [shortUrl, setShortUrl] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(""); // Clear previous errors
        setShortUrl(""); // Clear previous result

        try {
            const response = await fetch("http://127.0.0.1:5000/shorten", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();

            if (response.ok) {
                setShortUrl(data.short_url);
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

    return (
        <div className="hero-container">
            <div className="diamond-bg"></div>
            <div className="hero-content">
                <h2 className="hero-title">Enter your URL here</h2>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            className="url-input"
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com"
                        />
                        <button className="submit-button" type="submit">SHORTEN</button>
                    </div>
                </form>
                {error && <p className="error-message">{error}</p>}
                {shortUrl && (
                    <div className="result-container">
                        <p>Your Shortened URL: <a href={shortUrl} target="_blank" rel="noopener noreferrer">{shortUrl}</a></p>
                        <button className="copy-button" onClick={handleCopy}>Copy</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Hero;