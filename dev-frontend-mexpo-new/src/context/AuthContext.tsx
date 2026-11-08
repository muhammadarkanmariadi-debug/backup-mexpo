'use client';

import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { deleteCookies, getCookies } from '@/shared/utils/cookies';
import { getProfile, UnauthorizedError } from '@/services/user.service';

/** Same prefixes src/proxy.ts guards. */
const PROTECTED_PREFIXES = ['/dashboard', '/profile'];

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

            setUser(await getProfile());
        } catch (error) {
            clearUser();

            // The API rejected the token (expired/invalid). The httpOnly cookie
            // would otherwise outlive the JWT and keep route guards and /auth
            // thinking the user is still signed in, so drop it.
            if (error instanceof UnauthorizedError) {
                prevTokenRef.current = null;
                await deleteCookies('token');

                const { pathname } = window.location;
                if (PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
                    window.location.replace(`/auth?next=${encodeURIComponent(pathname)}`);
                }
            }
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