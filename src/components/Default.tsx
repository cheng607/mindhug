import { Button } from "antd";
import { useNavigate } from "react-router-dom";
import AgentImg from "../assets/agent2.png";
import { useUserStore } from "../store/userStore";

export default function Default() {
    const navigate = useNavigate();
    const userInfo = useUserStore(state => state.userInfo);

    const goConsultation = () => {
        if (userInfo) {
            navigate('/consultation');
        } else {
            navigate('/auth/login', { state: { from: { pathname: '/consultation' } } });
        }
    };

    const goDiary = () => {
        if (userInfo) {
            navigate('/diary');
        } else {
            navigate('/auth/login', { state: { from: { pathname: '/diary' } } });
        }
    };

    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-gradient-to-br from-[#589081] to-[#4a7a6d] px-6 py-12 sm:flex-row sm:gap-12 sm:px-10 sm:py-16">
            <div className="flex max-w-lg flex-col gap-4 text-center sm:gap-5 sm:text-left">
                <div className="text-3xl font-bold text-white sm:text-4xl">一次温暖的对话</div>
                <div className="text-2xl font-bold text-yellow-300 sm:text-4xl">化孤独为慰藉</div>
                <p className="text-sm leading-relaxed text-white/90 sm:text-base">
                    每个深夜，每个焦虑的时刻，我们都在这里。不必独自承受，让心与心的连接温暖您的每一天
                </p>
                <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
                    <Button type="primary" size="large" onClick={goConsultation}>
                        开始倾诉，获得陪伴
                    </Button>
                    <Button
                        size="large"
                        className="border-white bg-transparent text-white hover:!border-white hover:!bg-white/10 hover:!text-white"
                        onClick={goDiary}
                    >
                        记录心情，释放情感
                    </Button>
                </div>
            </div>
            <img src={AgentImg} alt="AI心理健康助手" className="w-48 sm:w-64 lg:w-72" />
        </div>
    );
}
