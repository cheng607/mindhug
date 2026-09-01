import { Button, Layout, message } from "antd";
import { Content, Footer, Header } from "antd/es/layout/layout";
import AgentIcon from "../assets/agent3.png"
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";
import { logout } from "../apis/user";

export default function Home() {
    const userInfo = useUserStore(state => state.userInfo);
    const roleType = useUserStore(state => state.roleType);
    const clearUserInfo = useUserStore(state => state.clearUserInfo);
    const navigate = useNavigate();
    // 退出登录
    const handleLogout = async () => {
        try {
            const res = await logout()
            clearUserInfo()
            message.success(res.data);
            // 延迟跳转，确保提示显示
            setTimeout(() => {
                navigate('/auth');
            }, 1000);
        } catch (error) {
            message.error((error as Error).message)
            console.error(error)
        }
    };

    return (
        <Layout className="min-h-screen">
            <Header className="bg-white h-12 flex items-center justify-between">
                <div className="flex items-center gap-3 mx-10">
                    <img src={AgentIcon} alt="" />
                    <span className="font-medium">心理健康AI助手</span>
                </div>
                <div className="flex items-center gap-5 mx-10">
                    <Link to={'/'}>首页</Link>

                    {userInfo && roleType === '1' ? (
                        <>
                            <Link to={'/consultation'}>AI咨询</Link>
                            <Link to={'/diary'}>情绪日记</Link>
                            <Link to={'/knowledgeBase'}>知识库</Link>
                            <Link to={'/profile'}>个人中心</Link>
                            <Button type="default" size="small" onClick={handleLogout}>退出登录</Button>
                        </>
                    ) : (
                        <>
                            <Link to={'/knowledgeBase'}>知识库</Link>
                            <Link to={'/auth/login'}>登录</Link>
                            <Button type="primary" size="small" onClick={() => { navigate('/auth/register') }}>注册</Button>
                        </>
                    )}
                </div>
            </Header>
            <Content>
                <Outlet />
            </Content>
            <Footer className="flex items-center justify-center bg-[#202834] text-white h-10">
                @2026 心理健康AI助手
            </Footer>
        </Layout >
    )
}
