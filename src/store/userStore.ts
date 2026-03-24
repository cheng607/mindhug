import { create } from 'zustand'
import type { UserInfoType } from '../types/userType'
interface UserStoreState {
    userInfo: UserInfoType | null;
    token: string | null;
    roleType: string | null;
    setUserInfo: (userInfo: UserInfoType, token: string, roleType: string) => void;
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
    token: localStorage.getItem('token') || null,
    roleType: localStorage.getItem('roleType') || null,
    // 设置完整用户信息
    setUserInfo: (userInfo, token, roleType) => {
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        localStorage.setItem('token', token);
        localStorage.setItem('roleType', roleType)
        set({ userInfo, token, roleType });
    },
    // 清空用户信息
    clearUserInfo: () => {
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
        localStorage.removeItem('roleType')
        set({ userInfo: null, token: null, roleType: null });
    },
}));