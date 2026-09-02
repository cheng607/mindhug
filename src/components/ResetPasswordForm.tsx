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
        <div className='flex items-center justify-center w-1/2'>
            <div className='relative flex flex-col items-center justify-center gap-5'>
                <Link to="/auth/login" className='absolute -top-20 -left-0'>
                    <SwapLeftOutlined />返回登录
                </Link>
                <div className='text-3xl font-semibold'>设置新密码</div>
                <Form name="reset" onFinish={onFinish} className='flex flex-col'>
                    <Form.Item
                        label="新密码"
                        layout='vertical'
                        name="newPassword"
                        rules={[{ required: true, min: 6, message: '密码至少 6 位' }]}
                        className='w-80'
                    >
                        <Input.Password placeholder="请输入新密码" />
                    </Form.Item>
                    <Form.Item
                        label="确认新密码"
                        layout='vertical'
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
                        <Input.Password placeholder="请再次输入新密码" />
                    </Form.Item>
                    <Form.Item>
                        <Button block type="primary" htmlType="submit" className='my-3'>
                            确认重置
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    )
}
