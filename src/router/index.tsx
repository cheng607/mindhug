import { createBrowserRouter } from "react-router-dom";
import NotFound from "../pages/NotFound";
import DashBoard from "../components/DashBoard";
import BackLayout from "../pages/BackLayout";
import Knowledge from "../components/Knowledge";
import Consultations from "../components/Consultations";
import Emotional from "../components/Emotional";
import Auth from "../pages/Auth";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import Home from "../pages/Home";
import { App } from "antd";

const userRoutes = {
    path: '/user',
    element: <App />,
    children: [
        // { path: '', element: <Home /> }
    ]
}
const authRoutes = {
    path: '/auth',
    element: <Auth />,
    children: [
        { path: "", element: <LoginForm /> },
        { path: 'login', element: <LoginForm /> },
        { path: 'register', element: <RegisterForm /> },
    ]
}
const backRoutes = {
    path: '/back',
    element: <BackLayout />,
    children: [
        { path: 'dashboard', element: <DashBoard /> },
        { path: 'Knowledge', element: <Knowledge /> },
        { path: 'consultations', element: <Consultations /> },
        { path: 'emotional', element: <Emotional /> },
    ]
}

const router = createBrowserRouter([
    { path: '/', element: <Home /> },
    userRoutes,
    authRoutes,
    backRoutes,
    { path: "*", element: <NotFound /> }
])
export default router