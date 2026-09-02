import { create } from 'zustand'
import type { UserInfoType } from '../types/userType'

interface UserStoreState {
    userInfo: UserInfoType | null;
    roleType: string | null;
    authReady: boolean;
    setUserInfo: (userInfo: UserInfoType, roleType: string) => void;
    setAuthReady: (ready: boolean) => void;
    clearUserInfo: () => void;
}

export const useUserStore = create<UserStoreState>((set) => ({
    userInfo: (() => {
        try {
            const stored = localStorage.getItem('userInfo');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Failed to parse userInfo from localStorage:', error);
            return null;
        }
    })(),
    roleType: localStorage.getItem('roleType') || null,
    authReady: false,
    setUserInfo: (userInfo, roleType) => {
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        localStorage.setItem('roleType', roleType);
        localStorage.removeItem('token');
        set({ userInfo, roleType, authReady: true });
    },
    setAuthReady: (ready) => set({ authReady: ready }),
    clearUserInfo: () => {
        localStorage.removeItem('userInfo');
        localStorage.removeItem('roleType');
        localStorage.removeItem('token');
        set({ userInfo: null, roleType: null, authReady: true });
    },
}));
