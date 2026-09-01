import { Button, Form, Input, message } from 'antd';
import type { RegisterParams } from '../types/userType';
import { register } from '../apis/user';
import { Link, useNavigate } from 'react-router-dom';

export default function RegisterForm() {
    const navigate = useNavigate()

    const onFinish = async (values: RegisterParams) => {
        try {
            const res = await register(values);
            console.log(res)
            if (res.code == '200') {
                message.success(res.msg)
                setTimeout(() => {
                    navigate('/auth/login');
                }, 1000);
            }
        } catch (error) {
            message.error((error as Error).message || '注册失败，请重试');
            console.error('注册失败:', error);
        }
    };
    return (
        <div className='flex flex-col items-center justify-center w-1/2 relative gap-3'>
            <div className='text-3xl font-semibold'>创建您的账户</div>
            <div className='text-sm text-gray-500'>请填写注册信息</div>
            <Form
                name="login"
                initialValues={{
                    remember: true,
                    userType: 1,
                    gender: 1,
                    phone: '',
                    nickname: ''
                }}
                onFinish={onFinish}
                className='flex flex-col'
            >
                <Form.Item
                    label="用户名"
                    layout='vertical'
                    name="username"
                    rules={[{ required: true, message: '请输入用户名' }]}
                    className='w-80 mb-1'
                >
                    <Input placeholder="请输入用户名" />
                </Form.Item>
                <Form.Item
                    label="邮箱"
                    layout='vertical'
                    name="email"
                    rules={[{ required: true, message: '请输入邮箱' }]}
                    className='w-80 mb-1'
                >
                    <Input placeholder="请输入邮箱" />
                </Form.Item>
                <Form.Item
                    label="昵称"
                    layout='vertical'
                    name="nickname"
                    className='w-80 mb-1'
                    normalize={(value) => {
                        if (value === undefined || value === null || value.trim() === '') {
                            return "";
                        }
                        return value;
                    }}
                >
                    <Input placeholder="请输入昵称（可选）" />
                </Form.Item>
                <Form.Item
                    label="手机号"
                    layout='vertical'
                    name="phone"
                    className='w-80 mb-1'
                    normalize={(value) => {
                        if (value === undefined || value === null || value.trim() === '') {
                            return "";
                        }
                        return value;
                    }}
                >
                    <Input placeholder="请输入手机号（可选）" />
                </Form.Item>
                <Form.Item
                    label="密码"
                    layout='vertical'
                    name="password"
                    rules={[{ required: true, message: '请输入密码' }]}
                >
                    <Input type="password" placeholder="请输入密码" />
                </Form.Item>
                <Form.Item
                    label="确认密码"
                    layout='vertical'
                    name="confirmPassword"
                    rules={[
                        { required: true, message: '请再次输入密码' },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('password') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error('两次输入的密码不一致！'));
                            },
                        }),
                    ]}
                >
                    <Input type="password" placeholder="请再次输入密码" />
                </Form.Item>
                <Form.Item name="gender" hidden>
                    <Input type="hidden" />
                </Form.Item>
                <Form.Item name="userType" hidden>
                    <Input type="hidden" />
                </Form.Item>
                <Form.Item>
                    <Button block type="primary" htmlType="submit" className='my-5'>
                        创建用户
                    </Button>
                    <div className='text-center'>
                        已有账户？<Link to='/auth/login' className='text-purple-900'>立即登录</Link>
                    </div>
                </Form.Item>
            </Form>
        </div>
    )
}
