import type { emotionAnalysType } from '../../types/sessionsType'

interface EmotionGardenProps {
    emotion?: emotionAnalysType
    compact?: boolean
}

export default function EmotionGarden({ emotion, compact = false }: EmotionGardenProps) {
    const primary = emotion?.primaryEmotion || '待分析'

    if (compact) {
        return (
            <div className="rounded-xl bg-white/80 p-3 text-xs">
                <div className="mb-1 font-medium text-gray-700">情绪洞察</div>
                <div className="text-gray-600">
                    当前：<span className="font-semibold text-gray-900">{primary}</span>
                </div>
                {emotion?.suggestion && (
                    <p className="mt-1.5 line-clamp-2 leading-relaxed text-gray-500">{emotion.suggestion}</p>
                )}
                {emotion?.isNegative && (emotion.riskLevel ?? 0) > 1 && (
                    <p className="mt-1.5 rounded-md bg-amber-50 px-2 py-1 text-amber-800">{emotion.riskDescription}</p>
                )}
            </div>
        )
    }

    return (
        <div className="rounded-xl border border-amber-100 bg-gradient-to-b from-[#FFF9F0] to-[#FFF4E6] p-4">
            <div className="text-sm font-semibold text-amber-900">情绪花园</div>
            <div className="mt-2 text-sm text-gray-600">
                今天感觉 <span className="font-semibold text-gray-900">{primary}</span>
            </div>
            {emotion?.suggestion && (
                <p className="mt-2 text-xs leading-relaxed text-gray-600">{emotion.suggestion}</p>
            )}
        </div>
    )
}
