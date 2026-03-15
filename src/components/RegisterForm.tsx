import { Button, Form, Input } from 'antd';
import type { LoginParams } from '../types/userType';
import { login } from '../apis/user';
import { Link, useNavigate } from 'react-router-dom';

export default function RegisterForm() {
    const navigate = useNavigate()

    const onFinish = async (values: LoginParams) => {
        try {
            const res = await login(values);
            if (!res.data.token) {
                return Promise.reject(new Error('登录失败，未返回token'));
            }
            // 登录成功
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('userInfo', JSON.stringify(res.data.userInfo));
            localStorage.setItem('roleType', res.data.roleType)
            navigate('/back')
        } catch (error) {
            console.error('登录失败:', error);
        }
    };
    return (
        <div className='flex flex-col items-center justify-center w-1/2 relative'>
            <div className='text-3xl font-semibold'>创建您的账户</div>
            <div className='text-sm text-gray-500'>请填写注册信息</div>
            <Form
                name="login"
                initialValues={{ remember: true }}
                onFinish={onFinish}
                className='flex flex-col'
            >
                <Form.Item
                    label="用户名或邮箱"
                    layout='vertical'
                    name="username"
                    rules={[{ required: true, message: '请输入用户名或邮箱' }]}
                    className='w-80'
                >
                    <Input placeholder="请输入用户名或邮箱" />
                </Form.Item>
                <Form.Item
                    label="邮箱"
                    layout='vertical'
                    name="email"
                    rules={[{ required: true, message: '请输入邮箱' }]}
                    className='w-80'
                >
                    <Input placeholder="请输入邮箱" />
                </Form.Item>
                <Form.Item
                    label="昵称"
                    layout='vertical'
                    name="username"
                    rules={[{ required: true, message: '请输入昵称（可选）' }]}
                    className='w-80'
                >
                    <Input placeholder="请输入昵称（可选）" />
                </Form.Item>
                <Form.Item
                    label="手机号"
                    layout='vertical'
                    name="username"
                    rules={[{ required: true, message: '请输入手机号（可选）' }]}
                    className='w-80'
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
                    name="password"
                    rules={[{ required: true, message: '请再次输入密码' }]}
                >
                    <Input type="password" placeholder="请再次输入密码" />
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
