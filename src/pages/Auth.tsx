import { Outlet } from "react-router-dom";

function Auth() {
    return (
        <div className="min-h-screen flex ">
            <div className="bg-blue-300 h-auto w-1/2">xxx</div>
            <Outlet />
        </div >
    );
};

export default Auth;