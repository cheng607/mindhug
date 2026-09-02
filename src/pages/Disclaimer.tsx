import { Link } from 'react-router-dom'
import { CRISIS_HOTLINE, CRISIS_HOTLINE_LABEL } from '../constants/crisis'

export default function Disclaimer() {
    return (
        <div className="max-w-3xl mx-auto py-10 px-6 text-gray-700 leading-relaxed">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">AI 服务免责声明</h1>
            <p className="text-sm text-gray-500 mb-8">更新日期：2026年9月1日</p>

            <section className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-amber-900 mb-2">重要提示</h2>
                <p className="text-amber-800">
                    MindHug 的 AI 助手是人工智能程序，<strong>不能替代</strong>持证心理咨询师、
                    精神科医生或其他专业医疗人员的判断与治疗。
                </p>
            </section>

            <section className="mb-6">
                <h2 className="text-lg font-semibold mb-2">服务范围</h2>
                <ul className="list-disc pl-5 space-y-1">
                    <li>情绪倾诉与陪伴性对话</li>
                    <li>心理健康科普知识参考</li>
                    <li>情绪自我觉察辅助（日记分析等）</li>
                </ul>
            </section>

            <section className="mb-6">
                <h2 className="text-lg font-semibold mb-2">不适用情形</h2>
                <ul className="list-disc pl-5 space-y-1">
                    <li>精神疾病诊断与治疗</li>
                    <li>药物处方或用药建议</li>
                    <li>紧急心理危机处置（请拨打热线）</li>
                </ul>
            </section>

            <section className="mb-6">
                <h2 className="text-lg font-semibold mb-2">危机求助</h2>
                <p>
                    如您或身边的人有自伤、自杀或伤害他人的想法，请立即拨打
                    <strong className="mx-1">{CRISIS_HOTLINE_LABEL} {CRISIS_HOTLINE}</strong>
                    或前往最近的心理卫生机构/医院急诊。
                </p>
            </section>

            <div className="mt-10">
                <Link to="/" className="text-purple-700 hover:underline">← 返回首页</Link>
            </div>
        </div>
    )
}
