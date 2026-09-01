import HeartImg from '../../assets/icon5.png'

interface ChatHeaderProps {
    onNewSession: () => void
    activeAgent?: string | null
}

export default function ChatHeader({ onNewSession, activeAgent }: ChatHeaderProps) {
    return (
        <div className='p-3 bg-[#E89645] h-20 flex items-center justify-between'>
            <div className='flex items-center'>
                <img src={HeartImg} className='p-3' alt="" />
                <div className='flex flex-col text-white gap-1'>
                    <div className='text-lg font-medium'>宁渡AI助手</div>
                    <div className='text-xs'>
                        {activeAgent ? `${activeAgent} 正在服务` : '您的贴心AI心理健康助手'}
                    </div>
                </div>
            </div>
            <button
                type="button"
                aria-label="新建会话"
                className='rounded-full bg-white w-8 h-8 flex items-center justify-center text-gray-400 mr-7 cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:text-gray-600 active:scale-95 border-none'
                onClick={onNewSession}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            </button>
        </div>
    )
}
