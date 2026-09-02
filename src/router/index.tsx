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
import App from "../App";
import { RequireAuth, RedirectIfAuth, RedirectAdminToBack } from "./RouteGuards";
import Consultation from "../components/Consultation";
import Diary from "../components/Diary";
import Default from "../components/Default";
import KnowledgeBase from "../components/KnowledgeBase";
import Article from "../components/Article";
import Profile from "../pages/Profile";
import RiskAlertCenter from "../components/RiskAlertCenter";
import AgentConfig from "../components/AgentConfig";
import UserAgreement from "../pages/UserAgreement";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import Disclaimer from "../pages/Disclaimer";

const userRoutes = {
    path: '/user',
    element: <App />
}
const authRoutes = {
    path: '/auth',
    element: (
        <RedirectIfAuth>
            <Auth />
        </RedirectIfAuth>
    ),
    children: [
        { path: "", element: <LoginForm /> },
        { path: 'login', element: <LoginForm /> },
        { path: 'register', element: <RegisterForm /> },
    ]
}
const backRoutes = {
    path: '/back',
    element: (
        <RequireAuth allowedRoles={['2']} redirectTo="/">
            <BackLayout />
        </RequireAuth>
    ),
    children: [
        { path: '', element: <DashBoard /> },
        { path: 'dashboard', element: <DashBoard /> },
        { path: 'Knowledge', element: <Knowledge /> },
        { path: 'consultations', element: <Consultations /> },
        { path: 'emotional', element: <Emotional /> },
        { path: 'risk-alerts', element: <RiskAlertCenter /> },
        { path: 'agent-config', element: <AgentConfig /> },
    ]
}

const router = createBrowserRouter([
    {
        path: '/',
        element: (
            <RedirectAdminToBack>
                <Home />
            </RedirectAdminToBack>
        ),
        children: [
            { path: '', element: <Default /> },
            { path: 'consultation', element: <RequireAuth><Consultation /></RequireAuth> },
            { path: 'diary', element: <RequireAuth><Diary /></RequireAuth> },
            { path: 'knowledgeBase', element: <KnowledgeBase /> },
            { path: 'profile', element: <RequireAuth><Profile /></RequireAuth> },
        ]
    },
    { path: 'article/:id', element: <Article /> },
    { path: 'agreement', element: <UserAgreement /> },
    { path: 'privacy', element: <PrivacyPolicy /> },
    { path: 'disclaimer', element: <Disclaimer /> },
    userRoutes,
    authRoutes,
    backRoutes,
    { path: "*", element: <NotFound /> }
])
export default router