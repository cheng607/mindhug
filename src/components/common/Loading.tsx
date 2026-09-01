import { Spin } from 'antd'

interface LoadingProps {
    tip?: string
    fullScreen?: boolean
}

export default function Loading({ tip = '加载中...', fullScreen = false }: LoadingProps) {
    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60">
                <Spin size="large" tip={tip} />
            </div>
        )
    }
    return (
        <div className="flex items-center justify-center py-12">
            <Spin tip={tip} />
        </div>
    )
}
