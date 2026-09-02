import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUserStore } from "../store/userStore";

export function RequireAuth({
    children,
    allowedRoles,
    redirectTo = "/",
}: {
    children: ReactNode;
    allowedRoles?: string[];
    redirectTo?: string;
}) {
    const userInfo = useUserStore((state) => state.userInfo);
    const roleType = useUserStore((state) => state.roleType);
    const authReady = useUserStore((state) => state.authReady);
    const location = useLocation();

    if (!authReady) return null;

    if (!userInfo) {
        return <Navigate to="/auth/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(roleType || "")) {
        return <Navigate to={redirectTo} replace />;
    }

    return <>{children}</>;
}

export function RedirectIfAuth({ children }: { children: ReactNode }) {
    const userInfo = useUserStore((state) => state.userInfo);
    const roleType = useUserStore((state) => state.roleType);
    const authReady = useUserStore((state) => state.authReady);

    if (!authReady) return null;

    if (userInfo) {
        if (roleType === "2") {
            return <Navigate to="/back/dashboard" replace />;
        }
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

export function RedirectAdminToBack({ children }: { children: ReactNode }) {
    const userInfo = useUserStore((state) => state.userInfo);
    const roleType = useUserStore((state) => state.roleType);
    const authReady = useUserStore((state) => state.authReady);

    if (!authReady) return null;

    if (userInfo && roleType === "2") {
        return <Navigate to="/back/dashboard" replace />;
    }

    return <>{children}</>;
}
