import { Link } from 'react-router-dom'

export default function PrivacyPolicy() {
    return (
        <div className="max-w-3xl mx-auto py-10 px-6 text-gray-700 leading-relaxed">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">隐私政策</h1>
            <p className="text-sm text-gray-500 mb-8">更新日期：2026年9月1日</p>

            <section className="mb-6">
                <h2 className="text-lg font-semibold mb-2">一、信息收集</h2>
                <p>我们可能收集以下信息以提供服务：</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>注册信息：用户名、邮箱、昵称等</li>
                    <li>使用数据：咨询对话、情绪日记、浏览记录</li>
                    <li>技术信息：设备类型、访问日志（已脱敏处理）</li>
                </ul>
            </section>

            <section className="mb-6">
                <h2 className="text-lg font-semibold mb-2">二、信息使用</h2>
                <ul className="list-disc pl-5 space-y-1">
                    <li>提供、维护和改进平台服务</li>
                    <li>进行情绪分析与风险预警（仅限服务所需范围）</li>
                    <li>保障平台安全，防范滥用行为</li>
                </ul>
            </section>

            <section className="mb-6">
                <h2 className="text-lg font-semibold mb-2">三、信息保护</h2>
                <p>
                    我们采用加密传输、访问控制、日志脱敏等技术措施保护您的数据安全。
                    咨询对话内容仅用于为您提供服务，不会向第三方出售。
                </p>
            </section>

            <section className="mb-6">
                <h2 className="text-lg font-semibold mb-2">四、您的权利</h2>
                <p>您有权查询、更正或删除个人数据，可通过个人中心或联系客服行使上述权利。</p>
            </section>

            <div className="mt-10">
                <Link to="/" className="text-purple-700 hover:underline">← 返回首页</Link>
            </div>
        </div>
    )
}
