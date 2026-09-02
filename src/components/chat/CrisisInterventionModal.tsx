import { useEffect, useState } from 'react'
import { Modal, Button } from 'antd'
import { PhoneOutlined, HeartOutlined } from '@ant-design/icons'
import { CRISIS_HOTLINE, CRISIS_HOTLINE_LABEL, CRISIS_RESOURCES } from '../../constants/crisis'
import { getCrisisResources, type CrisisResource } from '../../apis/legal'

interface CrisisInterventionModalProps {
    open: boolean
    onClose: () => void
}

export default function CrisisInterventionModal({ open, onClose }: CrisisInterventionModalProps) {
    const [hotline, setHotline] = useState(CRISIS_HOTLINE)
    const [hotlineLabel, setHotlineLabel] = useState(CRISIS_HOTLINE_LABEL)
    const [resources, setResources] = useState<readonly CrisisResource[]>(CRISIS_RESOURCES)

    useEffect(() => {
        if (!open) return
        getCrisisResources()
            .then((res) => {
                if (res.success && res.data) {
                    setHotline(res.data.hotline)
                    setHotlineLabel(res.data.hotlineLabel)
                    setResources(res.data.resources)
                }
            })
            .catch(() => {
                // 使用本地 constants 作为 fallback
            })
    }, [open])

    return (
        <Modal
            open={open}
            title={
                <span className="text-red-600 flex items-center gap-2">
                    <HeartOutlined />
                    我们关心你的安全
                </span>
            }
            onCancel={onClose}
            footer={[
                <Button key="close" type="primary" onClick={onClose}>
                    我知道了
                </Button>,
            ]}
            width={480}
            maskClosable={false}
        >
            <div className="space-y-4 text-gray-700">
                <p>
                    检测到你可能正在经历非常困难的时刻。请知道，<strong>你并不孤单，你值得被帮助</strong>。
                </p>
                <p>如果你正处于危险中或有伤害自己的念头，请立即采取以下行动：</p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
                        <PhoneOutlined />
                        {hotlineLabel}
                    </div>
                    <a
                        href={`tel:${hotline}`}
                        className="text-2xl font-bold text-red-600 hover:text-red-800"
                    >
                        {hotline}
                    </a>
                    <div className="text-xs text-gray-500 mt-1">24 小时免费心理援助</div>
                </div>
                <ul className="text-sm space-y-2">
                    {resources.map((item) => (
                        <li key={item.phone} className="flex justify-between">
                            <span>{item.name}</span>
                            <a href={`tel:${item.phone}`} className="text-blue-600 hover:underline">
                                {item.phone}
                            </a>
                        </li>
                    ))}
                </ul>
                <p className="text-sm text-gray-500">
                    也可以联系身边信任的家人或朋友，或前往最近的心理卫生中心 / 医院急诊。
                </p>
            </div>
        </Modal>
    )
}
