import { Button, Form, Input, message } from 'antd';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../apis/user';
import { SwapLeftOutlined } from '@ant-design/icons';

export default function ForgotPasswordForm() {
    const onFinish = async (values: { email: string }) => {
        try {
            await forgotPassword(values.email)
            message.success('若邮箱已注册，请查收重置邮件（开发模式请查看后端日志）')
        } catch (error) {
            message.error((error as Error).message || '请求失败，请稍后重试')
        }
    }

    return (
        <div className="w-full max-w-sm">
            <Link to="/auth/login" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#569080]">
                <SwapLeftOutlined />返回登录
            </Link>
            <div className="mb-6">
                <div className="text-2xl font-semibold text-gray-800">忘记密码</div>
                <p className="mt-1 text-sm text-gray-500">输入注册邮箱，我们将发送密码重置链接</p>
            </div>
            <Form name="forgot" layout="vertical" onFinish={onFinish} className="w-full">
                <Form.Item
                    label="邮箱"
                    name="email"
                    rules={[
                        { required: true, message: '请输入邮箱' },
                        { type: 'email', message: '邮箱格式不正确' },
                    ]}
                >
                    <Input placeholder="请输入注册邮箱" size="large" />
                </Form.Item>
                <Form.Item>
                    <Button block type="primary" htmlType="submit" size="large">
                        发送重置链接
                    </Button>
                </Form.Item>
            </Form>
        </div>
    )
}
