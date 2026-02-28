import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            setUser(JSON.parse(userData));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const res = await api.post('/api/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify({ id: res.data._id, name: res.data.name, email: res.data.email }));
            setUser({ id: res.data._id, name: res.data.name, email: res.data.email });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Login failed' };
        }
    };

    const signup = async (name, email, password) => {
        try {
            const res = await api.post('/api/auth/signup', { name, email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify({ id: res.data._id, name: res.data.name, email: res.data.email }));
            setUser({ id: res.data._id, name: res.data.name, email: res.data.email });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.message || 'Signup failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
