import { useEffect, type ReactNode } from 'react'
import { Spin } from 'antd'
import { getMe } from '../apis/user'
import { useUserStore } from '../store/userStore'

/** 应用启动时用 Cookie 会话恢复登录态（Q-06） */
export default function AuthProvider({ children }: { children: ReactNode }) {
    const authReady = useUserStore(state => state.authReady)
    const setUserInfo = useUserStore(state => state.setUserInfo)
    const clearUserInfo = useUserStore(state => state.clearUserInfo)
    const setAuthReady = useUserStore(state => state.setAuthReady)

    useEffect(() => {
        let cancelled = false
        getMe()
            .then(res => {
                if (cancelled) return
                setUserInfo(res.data, String(res.data.userType))
            })
            .catch(() => {
                if (cancelled) return
                clearUserInfo()
            })
            .finally(() => {
                if (!cancelled) setAuthReady(true)
            })
        return () => { cancelled = true }
    }, [setUserInfo, clearUserInfo, setAuthReady])

    if (!authReady) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spin size="large" tip="加载中..." />
            </div>
        )
    }

    return <>{children}</>
}
