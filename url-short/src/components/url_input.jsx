import React, { useState } from "react";

function InputUrl() {
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

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter URL to shorten"
                />
                <button type="submit">Shorten</button>
            </form>
            {shortUrl && (
                <div>
                    <p>Shortened URL: <a href={shortUrl} target="_blank" rel="noopener noreferrer">{shortUrl}</a></p>
                </div>
            )}
        </div>
    );
}

export default InputUrl;