import React from 'react';
import './Features.css'

function Features() {
    return (
        <div className="features-section">
            <h2>Features</h2>
            <div className="features-list">
                <div className="feature-item">
                    <span className="feature-icon">📊</span>
                    <p>Analytics Dashboard</p>
                </div>
                <div className="feature-item">
                    <span className="feature-icon">📱</span>
                    <p>QR Code</p>
                </div>
                <div className="feature-item">
                    <span className="feature-icon">🔒</span>
                    <p>Secure Links</p>
                </div>
            </div>
        </div>
    );
}

export default Features;