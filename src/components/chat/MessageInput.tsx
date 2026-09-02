import { Button } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import { SendOutlined } from '@ant-design/icons'

interface MessageInputProps {
    value: string
    disabled: boolean
    onChange: (value: string) => void
    onSend: () => void
}

export default function MessageInput({ value, disabled, onChange, onSend }: MessageInputProps) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSend()
        }
    }

    return (
        <div className="shrink-0 border-t border-slate-100 bg-white px-3 py-2.5 sm:px-4">
            <div className="relative mx-auto w-full max-w-3xl rounded-xl border border-slate-200 bg-slate-50 shadow-sm focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100">
                <TextArea
                    maxLength={500}
                    placeholder="输入想说的话，Enter 发送，Shift+Enter 换行"
                    autoSize={{ minRows: 2, maxRows: 5 }}
                    disabled={disabled}
                    value={value}
                    variant="borderless"
                    className="!bg-transparent !px-4 !pt-3 !pb-9"
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <div className="absolute bottom-2.5 left-4 text-xs text-gray-400">
                    {value.length} / 500
                </div>
                <Button
                    type="primary"
                    disabled={disabled || !value.trim()}
                    aria-label="发送消息"
                    className="!absolute !bottom-2.5 !right-2.5 !flex !h-8 !w-8 items-center justify-center !rounded-lg !border-none !bg-[#E89645] !p-0 hover:!bg-[#D4842A]"
                    onClick={onSend}
                >
                    <SendOutlined className="text-sm" />
                </Button>
            </div>
        </div>
    )
}
