import { InfoCircleOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { AI_DISCLAIMER } from '../../constants/crisis'

export default function AiDisclaimerBanner() {
    return (
        <div className="flex shrink-0 items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-3 py-1 text-[10px] leading-tight text-gray-500 sm:px-4">
            <InfoCircleOutlined className="shrink-0 text-[10px] text-gray-400" />
            <p className="m-0 truncate">
                {AI_DISCLAIMER}
                <Link to="/disclaimer" className="ml-1 text-gray-600 hover:text-orange-600 hover:underline">
                    了解更多
                </Link>
            </p>
        </div>
    )
}
