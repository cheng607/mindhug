import { InboxOutlined } from '@ant-design/icons'

interface EmptyProps {
    description?: string
    className?: string
}

export default function Empty({ description = '暂无数据', className = '' }: EmptyProps) {
    return (
        <div className={`flex flex-col items-center justify-center text-gray-400 ${className}`}>
            <InboxOutlined className="text-4xl mb-2" />
            <span>{description}</span>
        </div>
    )
}
