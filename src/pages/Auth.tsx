import { Outlet } from "react-router-dom";
import AgentIcon from "../assets/agent2.png"

function Auth() {
    return (
        <div className="flex min-h-screen flex-col md:h-screen md:flex-row md:overflow-hidden">
            <div className="flex shrink-0 items-center justify-center bg-[#569080] px-6 py-10 md:h-full md:w-1/2 md:py-0">
                <div className="flex max-w-md flex-col items-center gap-4 text-center md:gap-5">
                    <div className="text-3xl font-bold text-white md:text-4xl">MindHug 心语陪伴</div>
                    <p className="text-sm leading-relaxed text-white/90 md:text-base">
                        每个深夜，每个焦虑的时刻，我们都在这里。不必独自承受，让心与心的连接温暖您的每一天
                    </p>
                    <img className="w-40 rounded-lg md:w-48" src={AgentIcon} alt="" />
                </div>
            </div>
            <div className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto bg-white px-6 py-10 md:items-center md:py-8">
                <Outlet />
            </div>
        </div>
    );
};

export default Auth;
