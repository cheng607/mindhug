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
        <div className="flex items-center gap-3 p-3 border-t">
            <TextArea
                showCount
                maxLength={500}
                placeholder="请输入内容"
                style={{ height: 80, resize: 'none' }}
                disabled={disabled}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            <Button
                className='bg-[#E99D3F] w-14 h-14 rounded-lg hover:bg-[#d88f38] transition-all duration-200 flex items-center justify-center'
                type="primary"
                disabled={disabled || !value.trim()}
                onClick={onSend}
            >
                <SendOutlined className='text-lg text-white' />
            </Button>
        </div>
    )
}
