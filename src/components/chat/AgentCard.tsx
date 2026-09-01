import AgentIcon from '../../assets/agent4.png'

export default function AgentCard() {
    return (
        <div className='flex flex-col items-center gap-2 bg-[#FEFEFC] px-6 py-3 shadow-md rounded-xl border-2 w-72'>
            <img src={AgentIcon} alt="AI助手" />
            <div className='text-[#E79E39] font-medium'>宁渡AI助手</div>
            <div className='text-green-700 flex items-center gap-2 text-xs'>
                <div className='bg-green-700 w-1.5 h-1.5 rounded-full' />
                在线服务中
            </div>
        </div>
    )
}
