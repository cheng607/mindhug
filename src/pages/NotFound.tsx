import { Button } from 'antd'
import { Link, useNavigate } from 'react-router-dom'

export default function NotFound() {
    const navigate = useNavigate()
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
            <div className="text-6xl font-bold text-[#589081]">404</div>
            <h1 className="mt-4 text-xl font-semibold text-gray-800">页面不存在</h1>
            <p className="mt-2 text-sm text-gray-500">您访问的地址可能已变更或输入有误</p>
            <div className="mt-6 flex gap-3">
                <Button type="primary" onClick={() => navigate('/')}>返回首页</Button>
                <Link to="/consultation"><Button>AI 咨询</Button></Link>
            </div>
        </div>
    )
}
