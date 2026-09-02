import { Button, Form, Input, message } from 'antd';
import type { LoginParams } from '../types/userType';
import { login } from '../apis/user';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { SwapLeftOutlined } from '@ant-design/icons';

export default function LoginForm() {
    const navigate = useNavigate()
    const location = useLocation()
    const setUserInfo = useUserStore(state => state.setUserInfo)
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname
    const onFinish = async (values: LoginParams) => {
        try {
            const res = await login(values);
            setUserInfo(res.data.userInfo, res.data.roleType)
            if (res.data.roleType == '2') {
                navigate('/back')
            } else if (res.data.roleType == '1') {
                navigate(from || '/')
            }
        } catch (error) {
            message.error((error as Error).message || '登录失败，请重试');
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
                    <div className='text-right -mt-2 mb-2'>
                        <Link to='/auth/forgot' className='text-sm text-purple-900'>忘记密码？</Link>
                    </div>
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
