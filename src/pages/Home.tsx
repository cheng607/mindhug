import { Button, Layout, message } from "antd";
import { Content, Footer, Header } from "antd/es/layout/layout";
import AgentIcon from "../assets/agent3.png"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";
import { logout } from "../apis/user";

const navLinkClass = "whitespace-nowrap text-xs text-gray-600 hover:text-[#589081] transition-colors sm:text-sm";

export default function Home() {
    const userInfo = useUserStore(state => state.userInfo);
    const roleType = useUserStore(state => state.roleType);
    const clearUserInfo = useUserStore(state => state.clearUserInfo);
    const navigate = useNavigate();
    const location = useLocation();
    const isChatPage = location.pathname === '/consultation';

    const handleLogout = async () => {
        try {
            const res = await logout()
            clearUserInfo()
            message.success(res.data);
            setTimeout(() => {
                navigate('/auth');
            }, 1000);
        } catch (error) {
            message.error((error as Error).message)
            console.error(error)
        }
    };

    return (
        <Layout className={`flex flex-col ${isChatPage ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
            <Header className="site-header sticky top-0 z-50 !flex !h-11 shrink-0 items-center justify-between !bg-white !px-3 !py-0 sm:!px-5">
                <Link to="/" className="flex items-center gap-2">
                    <img src={AgentIcon} alt="" className="h-6 w-6" />
                    <span className="text-sm font-medium text-gray-800">MindHug 心语陪伴</span>
                </Link>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:gap-x-4">
                    <Link to="/" className={navLinkClass}>首页</Link>

                    {userInfo && roleType === '1' ? (
                        <>
                            <Link to="/consultation" className={navLinkClass}>AI咨询</Link>
                            <Link to="/diary" className={navLinkClass}>情绪日记</Link>
                            <Link to="/knowledgeBase" className={navLinkClass}>知识库</Link>
                            <Link to="/profile" className={navLinkClass}>个人中心</Link>
                            <Button type="default" size="small" className="!h-7 !text-xs" onClick={handleLogout}>退出</Button>
                        </>
                    ) : (
                        <>
                            <Link to="/knowledgeBase" className={navLinkClass}>知识库</Link>
                            <Link to="/auth/login" className={navLinkClass}>登录</Link>
                            <Button type="primary" size="small" className="!h-7 !text-xs" onClick={() => { navigate('/auth/register') }}>注册</Button>
                        </>
                    )}
                </div>
            </Header>
            <Content
                className={
                    isChatPage
                        ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
                        : 'flex flex-1 flex-col'
                }
            >
                <Outlet />
            </Content>
            {!isChatPage && (
                <Footer className="site-footer shrink-0 !bg-[#202834] !py-2 !px-3 text-white">
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-gray-400">
                        <Link to="/agreement" className="text-gray-300 hover:text-white">用户协议</Link>
                        <span className="hidden text-gray-600 sm:inline">·</span>
                        <Link to="/privacy" className="text-gray-300 hover:text-white">隐私政策</Link>
                        <span className="hidden text-gray-600 sm:inline">·</span>
                        <Link to="/disclaimer" className="text-gray-300 hover:text-white">免责声明</Link>
                        <span className="hidden text-gray-600 sm:inline">·</span>
                        <span>@2026 MindHug · AI 不能替代专业心理咨询</span>
                    </div>
                </Footer>
            )}
        </Layout>
    )
}
