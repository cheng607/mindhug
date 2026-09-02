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
        <div className="bg-[#589081] h-[600px] flex items-center justify-center gap-10">
            <div className="flex flex-col gap-5">
                <div className="text-white text-4xl font-bold">一次温暖的对话</div>
                <div className="text-yellow-300 text-4xl font-bold">化孤独为慰藉</div>
                <div className="text-white w-[440px]">
                    每个深夜，每个焦虑的时刻，我们都在这里。不必独自承受，让心与心的连接温暖您的每一天
                </div>
                <div className="flex gap-3">
                    <Button type="primary" size="large" onClick={goConsultation}>
                        开始倾诉，获得陪伴
                    </Button>
                    <Button
                        size="large"
                        className="bg-[#589081] text-white border-white hover:!text-white hover:!border-white"
                        onClick={goDiary}
                    >
                        记录心情，释放情感
                    </Button>
                </div>
            </div>
            <img src={AgentImg} alt="AI心理健康助手" />
        </div>
    );
}
