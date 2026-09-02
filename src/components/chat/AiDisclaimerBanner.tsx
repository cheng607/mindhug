import { Alert } from 'antd'
import { Link } from 'react-router-dom'
import { AI_DISCLAIMER } from '../../constants/crisis'

export default function AiDisclaimerBanner() {
    return (
        <Alert
            type="info"
            showIcon
            className="mb-3 text-xs"
            message={
                <span>
                    {AI_DISCLAIMER}
                    <Link to="/disclaimer" className="ml-2 text-blue-600 hover:underline">
                        了解更多
                    </Link>
                </span>
            }
        />
    )
}
