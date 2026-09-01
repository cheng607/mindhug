import { create } from 'zustand'

interface LoadingStore {
    count: number
    setLoading: (loading: boolean) => void
}

export const useLoadingStore = create<LoadingStore>((set, get) => ({
    count: 0,
    setLoading: (loading) => {
        set({ count: loading ? get().count + 1 : Math.max(0, get().count - 1) })
    },
}))
