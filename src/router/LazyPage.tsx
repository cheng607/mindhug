import { Suspense, type ReactNode } from 'react'
import { Spin } from 'antd'

export function LazyPage({ children }: { children: ReactNode }) {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center p-10 min-h-[200px]">
                <Spin size="large" />
            </div>
        }>
            {children}
        </Suspense>
    )
}
