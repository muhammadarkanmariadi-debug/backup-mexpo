'use client';

import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { getCookies } from '@/shared/utils/cookies';
import { getProfile } from '@/services/user.service';

interface AuthContextType {
    syncProfile: () => Promise<void>;
    isLoadingAuth: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const { setUser, clearUser } = useAuthStore();
    const prevTokenRef = useRef<string | null>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

    const syncProfile = useCallback(async () => {
        try {
            const token = await getCookies('token');

            if (token === prevTokenRef.current && prevTokenRef.current !== null) {
                return;
            }
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
        } catch {
            clearUser();
        } finally {
            setIsLoadingAuth(false);
        }
    }, [clearUser, setUser]);

    useEffect(() => {
        syncProfile();
    }, [syncProfile]);

    return (
        <AuthContext.Provider value={{ syncProfile, isLoadingAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};