import HeartIcon from '../../assets/heartIcon.png'
import type { emotionAnalysType } from '../../types/sessionsType'

interface EmotionGardenProps {
    emotion?: emotionAnalysType
}

export default function EmotionGarden({ emotion }: EmotionGardenProps) {
    return (
        <div className='flex flex-col items-center bg-[#FAF4E6] rounded-xl py-6 gap-3 w-72'>
            <div className='self-start text-amber-800 font-bold px-3'>情绪花园</div>
            <div className='w-20 h-20 border-white border-4 bg-pink-300 rounded-full flex items-center justify-center text-white'>
                {emotion?.primaryEmotion || '—'}
            </div>
            <div className='text-gray-500'>
                今天感觉
                <span className='font-bold text-black mx-3'>{emotion?.primaryEmotion || '待分析'}</span>
            </div>
            {emotion?.icon && emotion?.label && (
                <div className='text-xs'>{emotion.icon}{emotion.label}</div>
            )}
            {emotion?.suggestion && (
                <div className='bg-white flex w-4/5 items-center gap-3 p-3 rounded-lg shadow-md'>
                    <img src={HeartIcon} className='w-6 h-6' alt="" />
                    <div className='flex flex-col gap-2'>
                        <div className='text-amber-900 font-bold text-xs'>给你的小建议</div>
                        <div className='text-gray-600 text-xs'>{emotion.suggestion}</div>
                    </div>
                </div>
            )}
            {(emotion?.improvementSuggestions?.length ?? 0) > 0 && (
                <>
                    <div className='text-amber-800'>治愈小行动</div>
                    <div className='flex flex-col gap-3'>
                        {emotion!.improvementSuggestions.map((suggestion, index) => (
                            <div key={index} className='bg-white rounded-xl flex items-center p-3 w-56 gap-3'>
                                <div className='bg-yellow-400 w-1.5 h-1.5 rounded-full' />
                                <div>{suggestion}</div>
                            </div>
                        ))}
                    </div>
                </>
            )}
            {emotion?.isNegative && (emotion.riskLevel ?? 0) > 1 && (
                <div className='flex flex-col items-center bg-yellow-100 px-20 py-2 rounded-lg'>
                    <div className='text-amber-800'>温馨提醒</div>
                    <div className='text-amber-600 text-xs'>{emotion.riskDescription}</div>
                </div>
            )}
        </div>
    )
}
