import { Button, Layout } from "antd";
import { Content, Footer, Header } from "antd/es/layout/layout";
import AgentIcon from "../assets/agent3.png"
import AgentImg from "../assets/agent2.png"
import { Link, useNavigate } from "react-router-dom";

export default function Home() {
    const navigate = useNavigate()
    return (
        <Layout className="h-screen">
            <Header className="bg-white h-12 flex items-center justify-between">
                <div className="flex items-center gap-3 mx-10">
                    <img src={AgentIcon} alt="" />
                    <span className="font-medium">心理健康AI助手</span>
                </div>
                <div className="flex items-center gap-5 mx-10">
                    <Link to={'/home'}>首页</Link>
                    <Link to={'/home'}>知识库</Link>
                    <Link to={'/auth/login'}>登录</Link>
                    <Button type="primary" size="small" onClick={() => { navigate('/auth/register') }}>注册</Button>
                </div>
            </Header>
            <Content className="bg-[#589081] h-auto flex items-center justify-center gap-10">
                <div className="flex flex-col gap-5">
                    <div className="text-white text-4xl font-bold">一次温暖的对话</div>
                    <div className="text-yellow-300 text-4xl font-bold">化孤独为慰藉</div>
                    <div className="text-white w-[440px]">每个深夜，每个焦虑的时刻，我们都在这里。不必独自承受，让心与心的连接温暖您的每一天</div>
                    <div className="flex gap-3">
                        <Button>开始倾话，获得陪伴</Button>
                        <Button className="bg-[#589081] text-white">记录心情，释放情感</Button>
                    </div>
                </div>
                <img src={AgentImg} alt="" />
            </Content>
            <Footer className="flex items-center justify-center h-10 bg-[#202834] text-white">
                @2026 心理健康AI助手
            </Footer>
        </Layout >
    )
}
