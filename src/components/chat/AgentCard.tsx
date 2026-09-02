import AgentIcon from '../../assets/agent4.png'

export default function AgentCard() {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-white px-4 py-3 shadow-sm">
            <img src={AgentIcon} alt="AI助手" className="h-12 w-12 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
                <div className="font-medium text-[#D4842A]">MindHug 小暖</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-700">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    在线服务中
                </div>
            </div>
        </div>
    )
}
