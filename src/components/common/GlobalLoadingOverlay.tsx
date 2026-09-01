import { useLoadingStore } from '../../store/loadingStore'

export default function GlobalLoadingOverlay() {
    const count = useLoadingStore(state => state.count)
    if (count <= 0) return null
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/50 pointer-events-none">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#589081] border-t-transparent" />
        </div>
    )
}
