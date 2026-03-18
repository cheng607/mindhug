import { useState } from 'react';
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    MailOutlined,
    PieChartOutlined,
    MessageOutlined,
    UserOutlined
} from '@ant-design/icons';
import { Avatar, Button, Layout, Menu, theme, Dropdown, Space, message } from 'antd';
import type { DropdownProps, MenuProps } from 'antd';
import AgentIcon from '../assets/agent.png'
import { useUserStore } from '../store/userStore';
import { logout } from '../apis/user';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
const { Header, Sider, Content } = Layout;
function BackLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // 菜单配置
    const menuMap = [
        {
            key: '1',
            path: '/back/dashboard',
            icon: <PieChartOutlined />,
            label: '数据分析',
        },
        {
            key: '2',
            path: '/back/Knowledge',
            icon: <MessageOutlined />,
            label: '知识文库',
        },
        {
            key: '3',
            path: '/back/consultations',
            icon: <MailOutlined />,
            label: '咨询记录',
        },
        {
            key: '4',
            path: '/back/emotional',
            icon: <UserOutlined />,
            label: '情绪日志',
        }
    ]

    // 获取当前选中的菜单key
    const getCurrentMenuKey = () => {
        const currentPath = location.pathname;
        const menu = menuMap.find(item => item.path === currentPath);
        return menu?.key || '1';
    };

    // 获取当前菜单标签
    const getCurrentMenuLabel = () => {
        const currentPath = location.pathname;
        const menu = menuMap.find(item => item.path === currentPath);
        return menu?.label || '数据分析';
    };

    const handleMenuClick = (key: string) => {
        const menu = menuMap.find(item => item.key === key);
        if (menu) {
            navigate(menu.path);
        }
    };
    // 获取用户信息
    const userInfo = useUserStore(state => state.userInfo)
    const clearUserInfo = useUserStore(state => state.clearUserInfo)
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();
    const [open, setOpen] = useState(false);

    const handleLogout: MenuProps['onClick'] = async () => {
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
    // 处理下拉框
    const handleOpenChange: DropdownProps['onOpenChange'] = (nextOpen, info) => {
        if (info.source === 'trigger' || nextOpen) {
            setOpen(nextOpen);
        }
    };
    return (
        <Layout className='h-auto min-h-screen'>
            <Sider trigger={null} collapsible collapsed={collapsed} className='h-auto'>
                <div className='h-24 flex items-center justify-center gap-3'>
                    <img src={AgentIcon} className='w-14 h-14' />
                    {!collapsed && (
                        <div className='flex flex-col gap-2'>
                            <div className='text-white'>心理健康AI助手</div>
                            <div className='text-xs text-gray-300'>管理后台</div>
                        </div>
                    )}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    defaultSelectedKeys={[getCurrentMenuKey()]}
                    onClick={(item) => { handleMenuClick(item.key) }}
                    items={menuMap}
                />
            </Sider>
            <Layout>
                <Header className='p-0 flex items-center justify-between' style={{ background: colorBgContainer }}>
                    <div className='flex items-center'>
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{
                                fontSize: '16px',
                                width: 64,
                                height: 64,
                            }}
                        />
                        <div className='text-lg font-bold'>{getCurrentMenuLabel()}</div>
                    </div>
                    <div className='flex items-center mx-5 gap-3'>
                        <span>{userInfo?.nickname}</span>
                        <Dropdown
                            menu={{
                                items: [
                                    {
                                        label: '退出登录',
                                        key: '1',
                                    }
                                ],
                                onClick: handleLogout,
                            }}
                            onOpenChange={handleOpenChange}
                            open={open}
                        >
                            <a onClick={(e) => e.preventDefault()}>
                                <Space>
                                    <Avatar src={`http://159.75.169.224:1235/api${userInfo?.avatar}`} />
                                </Space>
                            </a>
                        </Dropdown>
                    </div>

                </Header>

                <Content
                    style={{
                        margin: '24px 16px',
                        padding: 24,
                        minHeight: 280,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default BackLayout;