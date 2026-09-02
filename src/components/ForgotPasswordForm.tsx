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
        <div className='flex items-center justify-center w-1/2'>
            <div className='relative flex flex-col items-center justify-center gap-5'>
                <Link to="/auth/login" className='absolute -top-20 -left-0'>
                    <SwapLeftOutlined />返回登录
                </Link>
                <div className='text-3xl font-semibold'>忘记密码</div>
                <div className='text-sm text-gray-500 text-center w-80'>
                    输入注册邮箱，我们将发送密码重置链接
                </div>
                <Form name="forgot" onFinish={onFinish} className='flex flex-col'>
                    <Form.Item
                        label="邮箱"
                        layout='vertical'
                        name="email"
                        rules={[
                            { required: true, message: '请输入邮箱' },
                            { type: 'email', message: '邮箱格式不正确' },
                        ]}
                        className='w-80'
                    >
                        <Input placeholder="请输入注册邮箱" />
                    </Form.Item>
                    <Form.Item>
                        <Button block type="primary" htmlType="submit" className='my-3'>
                            发送重置链接
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    )
}
