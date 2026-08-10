'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { getCookies } from '@/shared/utils/cookies';
import { getProfile } from '@/services/user.service';



interface AuthContextType {
    syncProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const { setUser, clearUser } = useAuthStore();
    const prevTokenRef = useRef<string | null>(null);

    const syncProfile = async () => {
        const token = await getCookies('token');

        if (token === prevTokenRef.current) return;
        prevTokenRef.current = token;

        if (!token) {
            clearUser();
            return;
        }

        const response = await getProfile();

        if (response) {
            setUser(response);
        } else {
            clearUser();
        }
    };

    useEffect(() => {
        syncProfile();
    }, []);
    return (
        <AuthContext.Provider value={{ syncProfile }
        }>
            {children}
        </AuthContext.Provider>
    );


};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};