import type { ReactNode } from 'react'

interface PageHeroProps {
    icon: ReactNode
    title: string
    subtitle?: string
    gradient?: string
}

export default function PageHero({
    icon,
    title,
    subtitle,
    gradient = 'from-[#589081] to-[#6BA892]',
}: PageHeroProps) {
    return (
        <div className={`w-full bg-gradient-to-r ${gradient} px-4 py-8 sm:px-8 sm:py-10`}>
            <div className="mx-auto flex max-w-6xl items-center gap-3 sm:gap-4">
                <div className="text-2xl text-white sm:text-3xl">{icon}</div>
                <div>
                    <h1 className="text-2xl font-bold text-white sm:text-3xl">{title}</h1>
                    {subtitle && <p className="mt-1 text-sm text-white/85 sm:text-base">{subtitle}</p>}
                </div>
            </div>
        </div>
    )
}
