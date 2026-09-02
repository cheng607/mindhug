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
        <div className="w-full max-w-sm">
            <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#569080]">
                <SwapLeftOutlined />返回首页
            </Link>
            <div className="mb-6">
                <div className="text-2xl font-semibold text-gray-800">登录您的账户</div>
                <div className="mt-1 text-sm text-gray-500">请输入您的登录信息</div>
            </div>
            <Form
                name="login"
                layout="vertical"
                initialValues={{ remember: true }}
                onFinish={onFinish}
                className="w-full"
            >
                <Form.Item
                    label="用户名或邮箱"
                    name="username"
                    rules={[{ required: true, message: '请输入用户名或邮箱' }]}
                >
                    <Input placeholder="请输入用户名或邮箱" size="large" />
                </Form.Item>
                <Form.Item
                    label="密码"
                    name="password"
                    rules={[{ required: true, message: '请输入密码' }]}
                >
                    <Input.Password placeholder="请输入密码" size="large" />
                </Form.Item>
                <div className="mb-4 text-right">
                    <Link to="/auth/forgot" className="text-sm text-[#569080] hover:underline">忘记密码？</Link>
                </div>
                <Form.Item className="mb-3">
                    <Button block type="primary" htmlType="submit" size="large">
                        登录账户
                    </Button>
                </Form.Item>
                <div className="text-center text-sm text-gray-500">
                    还没有账户？<Link to="/auth/register" className="text-[#569080] hover:underline">去注册</Link>
                </div>
            </Form>
        </div>
    )
}
