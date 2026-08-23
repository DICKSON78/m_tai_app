import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes in ms
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const logoutTimer = useRef(null);
    const verifying = useRef(false);

    const clearIdleTimer = useCallback(() => {
        if (logoutTimer.current) {
            clearTimeout(logoutTimer.current);
            logoutTimer.current = null;
        }
    }, []);

    const performLogout = useCallback(async () => {
        clearIdleTimer();
        try { await api.post('/logout'); } catch (e) {}
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/login';
    }, [clearIdleTimer]);

    const resetIdleTimer = useCallback(() => {
        clearIdleTimer();
        logoutTimer.current = setTimeout(() => {
            performLogout();
        }, IDLE_TIMEOUT);
    }, [clearIdleTimer, performLogout]);

    // Verify token with backend on mount
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            setLoading(false);
            return;
        }

        // Verify token is still valid with the backend
        api.get('/user').then(res => {
            const userData = res.data.user || res.data;
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            setLoading(false);
            // Start idle timer after successful verification
            resetIdleTimer();
        }).catch(() => {
            // Token invalid/expired — clear everything
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            setUser(null);
            setLoading(false);
        });
    }, [resetIdleTimer]);

    // Track user activity and reset idle timer
    useEffect(() => {
        if (!user) return;

        const handleActivity = () => {
            resetIdleTimer();
        };

        ACTIVITY_EVENTS.forEach(event => {
            document.addEventListener(event, handleActivity, { passive: true });
        });

        return () => {
            ACTIVITY_EVENTS.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
            clearIdleTimer();
        };
    }, [user, resetIdleTimer, clearIdleTimer]);

    // Clean up timer on unmount
    useEffect(() => {
        return () => clearIdleTimer();
    }, [clearIdleTimer]);

    const login = async (loginField, password) => {
        const response = await api.post('/login', { login: loginField, password });
        const { user: userData, token } = response.data;
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        resetIdleTimer();
        return userData;
    };

    const register = async (data, type) => {
        const endpoint = type === 'customer' ? '/register/customer' : '/register/seller';
        try {
            const response = await api.post(endpoint, data);
            const { user: userData, token } = response.data;
            localStorage.setItem('auth_token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            resetIdleTimer();
            return userData;
        } catch (err) {
            const serverMsg = err?.response?.data?.message;
            const serverErrors = err?.response?.data?.errors;
            const firstError = serverErrors ? Object.values(serverErrors).flat()[0] : null;
            return { message: serverMsg || firstError || 'Registration failed' };
        }
    };

    const logout = async () => {
        clearIdleTimer();
        try { await api.post('/logout'); } catch (e) {}
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
