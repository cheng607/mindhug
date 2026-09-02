import { Button, Form, Input, message } from 'antd';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../apis/user';
import { SwapLeftOutlined } from '@ant-design/icons';

export default function ResetPasswordForm() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const token = searchParams.get('token') || ''

    const onFinish = async (values: { newPassword: string; confirmPassword: string }) => {
        if (!token) {
            message.error('重置链接无效，请重新申请')
            return
        }
        try {
            await resetPassword({
                token,
                newPassword: values.newPassword,
                confirmPassword: values.confirmPassword,
            })
            message.success('密码已重置，请登录')
            navigate('/auth/login')
        } catch (error) {
            message.error((error as Error).message || '重置失败，请重新申请链接')
        }
    }

    return (
        <div className="w-full max-w-sm">
            <Link to="/auth/login" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#569080]">
                <SwapLeftOutlined />返回登录
            </Link>
            <div className="mb-6">
                <div className="text-2xl font-semibold text-gray-800">设置新密码</div>
            </div>
            <Form name="reset" layout="vertical" onFinish={onFinish} className="w-full">
                <Form.Item
                    label="新密码"
                    name="newPassword"
                    rules={[{ required: true, min: 6, message: '密码至少 6 位' }]}
                >
                    <Input.Password placeholder="请输入新密码" size="large" />
                </Form.Item>
                <Form.Item
                    label="确认新密码"
                    name="confirmPassword"
                    dependencies={['newPassword']}
                    rules={[
                        { required: true, message: '请再次输入新密码' },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('newPassword') === value) {
                                    return Promise.resolve()
                                }
                                return Promise.reject(new Error('两次输入的密码不一致'))
                            },
                        }),
                    ]}
                >
                    <Input.Password placeholder="请再次输入新密码" size="large" />
                </Form.Item>
                <Form.Item>
                    <Button block type="primary" htmlType="submit" size="large">
                        确认重置
                    </Button>
                </Form.Item>
            </Form>
        </div>
    )
}
