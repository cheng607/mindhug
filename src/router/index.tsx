import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import NotFound from "../pages/NotFound";
import DashBoard from "../components/DashBoard";
import BackLayout from "../pages/BackLayout";
import Knowledge from "../components/Knowledge";
import Consultations from "../components/Consultations";
import Emotional from "../components/Emotional";
import Auth from "../pages/Auth";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";

const userRoutes = {
    path: '/',
    element: <App />
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
        { path: 'konwledge', element: <Knowledge /> },
        { path: 'consultations', element: <Consultations /> },
        { path: 'emotional', element: <Emotional /> },
    ]
}

const router = createBrowserRouter([
    userRoutes,
    authRoutes,
    backRoutes,
    { path: "*", element: <NotFound /> }
])
export default router