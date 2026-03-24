import { Button } from "antd";
import AgentImg from "../assets/agent2.png"

export default function Default() {
    return (
        <div className="bg-[#589081] h-[600px] flex items-center justify-center gap-10">
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
        </div>
    )
}
