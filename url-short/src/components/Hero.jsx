import React, { useState } from "react";
import './Hero.css'

function Hero() {
    const [url, setUrl] = useState("");
    const [shortUrl, setShortUrl] = useState("");

    const handleSubmit = (event) => {
        event.preventDefault();
        fetch("http://127.0.0.1:5000/shorten", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ url }),
        })
            .then((response) => response.json())
            .then((data) => {
                setShortUrl(data.short_url);
            })
            .catch((error) => {
                console.error("Error:", error);
            });
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