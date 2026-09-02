import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { LazyPage } from "./LazyPage";
import NotFound from "../pages/NotFound";
import BackLayout from "../pages/BackLayout";
import Auth from "../pages/Auth";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import Home from "../pages/Home";
import App from "../App";
import { RequireAuth, RedirectIfAuth, RedirectAdminToBack } from "./RouteGuards";
import Default from "../components/Default";
import UserAgreement from "../pages/UserAgreement";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import Disclaimer from "../pages/Disclaimer";

const DashBoard = lazy(() => import("../components/DashBoard"));
const Knowledge = lazy(() => import("../components/Knowledge"));
const Consultations = lazy(() => import("../components/Consultations"));
const Emotional = lazy(() => import("../components/Emotional"));
const RiskAlertCenter = lazy(() => import("../components/RiskAlertCenter"));
const AgentConfig = lazy(() => import("../components/AgentConfig"));
const AgentLogs = lazy(() => import("../components/AgentLogs"));
const Consultation = lazy(() => import("../components/Consultation"));
const Diary = lazy(() => import("../components/Diary"));
const KnowledgeBase = lazy(() => import("../components/KnowledgeBase"));
const Article = lazy(() => import("../components/Article"));
const Profile = lazy(() => import("../pages/Profile"));

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
        { path: '', element: <LazyPage><DashBoard /></LazyPage> },
        { path: 'dashboard', element: <LazyPage><DashBoard /></LazyPage> },
        { path: 'Knowledge', element: <LazyPage><Knowledge /></LazyPage> },
        { path: 'consultations', element: <LazyPage><Consultations /></LazyPage> },
        { path: 'emotional', element: <LazyPage><Emotional /></LazyPage> },
        { path: 'risk-alerts', element: <LazyPage><RiskAlertCenter /></LazyPage> },
        { path: 'agent-config', element: <LazyPage><AgentConfig /></LazyPage> },
        { path: 'agent-logs', element: <LazyPage><AgentLogs /></LazyPage> },
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
            { path: 'consultation', element: <RequireAuth><LazyPage><Consultation /></LazyPage></RequireAuth> },
            { path: 'diary', element: <RequireAuth><LazyPage><Diary /></LazyPage></RequireAuth> },
            { path: 'knowledgeBase', element: <LazyPage><KnowledgeBase /></LazyPage> },
            { path: 'profile', element: <RequireAuth><LazyPage><Profile /></LazyPage></RequireAuth> },
        ]
    },
    { path: 'article/:id', element: <LazyPage><Article /></LazyPage> },
    { path: 'agreement', element: <UserAgreement /> },
    { path: 'privacy', element: <PrivacyPolicy /> },
    { path: 'disclaimer', element: <Disclaimer /> },
    userRoutes,
    authRoutes,
    backRoutes,
    { path: "*", element: <NotFound /> }
])
export default router
