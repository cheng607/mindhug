import { Outlet } from "react-router-dom";
import AgentIcon from "../assets/agent2.png"

function Auth() {
    return (
        <div className="min-h-screen flex">
            <div className="bg-[#569080] h-auto w-1/2 flex items-center justify-center">
                <div className="flex flex-col items-center justify-center w-1/2 gap-5">
                    <div className="text-4xl text-white font-bold">心理AI助手</div>
                    <div className="text-white text-center">
                        每个深夜，每个焦虑的时刻，我们都在这里。不必独自承受，让心与心的连接温暖您的每一天
                    </div>
                    <img className="rounded" src={AgentIcon} alt="" />
                </div>
            </div>
            <Outlet />
        </div >
    );
};

export default Auth;