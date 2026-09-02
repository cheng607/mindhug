import { Link } from 'react-router-dom'

export default function UserAgreement() {
    return (
        <div className="max-w-3xl mx-auto py-10 px-6 text-gray-700 leading-relaxed">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">用户服务协议</h1>
            <p className="text-sm text-gray-500 mb-8">更新日期：2026年9月1日</p>

            <section className="mb-6">
                <h2 className="text-lg font-semibold mb-2">一、服务说明</h2>
                <p>
                    MindHug（心语陪伴）是一款 AI 驱动的心理健康陪伴平台，为用户提供情绪倾诉、
                    心理知识学习、情绪日记等功能。使用本服务即表示您同意本协议全部条款。
                </p>
            </section>

            <section className="mb-6">
                <h2 className="text-lg font-semibold mb-2">二、服务边界</h2>
                <ul className="list-disc pl-5 space-y-1">
                    <li>本平台提供的 AI 对话<strong>不构成</strong>专业心理咨询、精神科诊疗或医疗建议。</li>
                    <li>如您处于心理危机或存在自伤/伤人风险，请立即拨打心理援助热线或前往医疗机构。</li>
                    <li>平台不对 AI 生成内容的准确性、完整性作任何保证。</li>
                </ul>
            </section>

            <section className="mb-6">
                <h2 className="text-lg font-semibold mb-2">三、用户义务</h2>
                <ul className="list-disc pl-5 space-y-1">
                    <li>提供真实、准确的注册信息，妥善保管账号密码。</li>
                    <li>不得利用本平台发布违法、有害或侵犯他人权益的内容。</li>
                    <li>不得对平台进行逆向工程、攻击或其他破坏行为。</li>
                </ul>
            </section>

            <section className="mb-6">
                <h2 className="text-lg font-semibold mb-2">四、隐私保护</h2>
                <p>
                    我们重视您的隐私，具体请参阅
                    <Link to="/privacy" className="text-purple-700 mx-1 hover:underline">隐私政策</Link>。
                </p>
            </section>

            <section className="mb-6">
                <h2 className="text-lg font-semibold mb-2">五、免责声明</h2>
                <p>
                    因不可抗力、第三方服务故障或用户自身原因导致的服务中断或数据丢失，
                    平台在法律允许范围内不承担责任。详见
                    <Link to="/disclaimer" className="text-purple-700 mx-1 hover:underline">免责声明</Link>。
                </p>
            </section>

            <div className="mt-10">
                <Link to="/" className="text-purple-700 hover:underline">← 返回首页</Link>
            </div>
        </div>
    )
}
