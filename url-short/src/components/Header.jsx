import React from 'react';
import './Header.css';

const Header = () => {
    return (
        <header className="header">
            <nav>
                <a href="/login">Login</a>
                <a href="/signup" className="signup-btn">Sign Up</a>
            </nav>
        </header>
    );
};

export default Header;
