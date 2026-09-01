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
        ]
    },
    { path: 'article/:id', element: <Article /> },
    userRoutes,
    authRoutes,
    backRoutes,
    { path: "*", element: <NotFound /> }
])
export default router