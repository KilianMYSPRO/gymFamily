import React, { createContext, useContext, useState, useEffect } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem('duogym-token'));
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('duogym-user'));
        } catch {
            return null;
        }
    });

    useEffect(() => {
        if (token) {
            localStorage.setItem('duogym-token', token);
        } else {
            localStorage.removeItem('duogym-token');
        }
    }, [token]);

    useEffect(() => {
        if (user) {
            localStorage.setItem('duogym-user', JSON.stringify(user));
        } else {
            localStorage.removeItem('duogym-user');
        }
    }, [user]);

    const login = (authData) => {
        setToken(authData.token);
        setUser(authData.user);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            token,
            user,
            login,
            logout,
            isAuthenticated: !!token
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
