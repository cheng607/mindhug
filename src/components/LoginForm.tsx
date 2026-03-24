import { Button, Form, Input } from 'antd';
import type { LoginParams } from '../types/userType';
import { login } from '../apis/user';
import { Link, useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { SwapLeftOutlined } from '@ant-design/icons';

export default function LoginForm() {
    const navigate = useNavigate()
    const setUserInfo = useUserStore(state => state.setUserInfo)
    const onFinish = async (values: LoginParams) => {
        try {
            const res = await login(values);
            if (!res.data.token) {
                return Promise.reject(new Error('登录失败，未返回token'));
            }
            setUserInfo(res.data.userInfo, res.data.token, res.data.roleType)
            // 登录成功
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('userInfo', JSON.stringify(res.data.userInfo));
            localStorage.setItem('roleType', res.data.roleType)
            // 根据用户角色来跳转页面
            if (res.data.roleType == '2') {
                navigate('/back')
            } else if (res.data.roleType == '1') {
                navigate('/front')
            }
        } catch (error) {
            console.error('登录失败:', error);
        }
    };
    return (
        <div className='flex items-center justify-center w-1/2'>
            <div className='relative flex flex-col items-center justify-center gap-5'>
                <Link to="/" className='absolute -top-20 -left-0'><SwapLeftOutlined />返回首页</Link>
                <div className='text-3xl font-semibold'>登录您的账户</div>
                <div className='text-sm text-gray-500'>请输入您的登录信息</div>
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
                        label="密码"
                        layout='vertical'
                        name="password"
                        rules={[{ required: true, message: '请输入密码' }]}
                    >
                        <Input.Password placeholder="请输入密码" />
                    </Form.Item>
                    <Form.Item>
                        <Button block type="primary" htmlType="submit" className='my-5'>
                            登录账户
                        </Button>
                        <div className='text-center'>
                            还没有账户？<Link to='/auth/register' className='text-purple-900'>去注册</Link>
                        </div>
                    </Form.Item>
                </Form>
            </div>
        </div>
    )
}
