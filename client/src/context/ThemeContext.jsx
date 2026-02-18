import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const themes = {
    DEFAULT: { id: 'DEFAULT', name: 'Neon Green', repRequired: 0, class: 'theme-green' },
    CYBER_PULSE: { id: 'CYBER_PULSE', name: 'Cyber Blue', repRequired: 500, class: 'theme-blue' },
    CARBON_CORE: { id: 'CARBON_CORE', name: 'Carbon Red', repRequired: 1500, class: 'theme-red' },
    ELITE_VOID: { id: 'ELITE_VOID', name: 'Elite Void', repRequired: 3000, class: 'theme-void' }
};

export const ThemeProvider = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState(() => {
        return localStorage.getItem('codeneon_theme') || 'DEFAULT';
    });

    useEffect(() => {
        localStorage.setItem('codeneon_theme', currentTheme);
        // Apply class to body
        const themeClass = themes[currentTheme]?.class || 'theme-green';
        document.body.className = themeClass;
    }, [currentTheme]);

    return (
        <ThemeContext.Provider value={{ currentTheme, setCurrentTheme, themes }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
