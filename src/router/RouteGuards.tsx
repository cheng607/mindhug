import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUserStore } from "../store/userStore";

/**
 * 登录保护：必须登录才能访问，否则跳转到登录页
 * 可选的 allowedRoles 控制哪些角色可以访问。
 */
export function RequireAuth({
    children,
    allowedRoles,
    redirectTo = "/",
}: {
    children: ReactNode;
    allowedRoles?: string[];
    redirectTo?: string;
}) {
    const token = useUserStore((state) => state.token);
    const roleType = useUserStore((state) => state.roleType);
    const location = useLocation();

    if (!token) {
        return <Navigate to="/auth/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(roleType || "")) {
        return <Navigate to={redirectTo} replace />;
    }

    return <>{children}</>;
}

/**
 * 如果已经登录则重定向到对应入口（管理员 /back，普通用户 /）
 */
export function RedirectIfAuth({ children }: { children: ReactNode }) {
    const token = useUserStore((state) => state.token);
    const roleType = useUserStore((state) => state.roleType);

    if (token) {
        if (roleType === "2") {
            return <Navigate to="/back/dashboard" replace />;
        }
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
/**
 * 管理员已登录时，访问主页时自动跳转到后台
 */
export function RedirectAdminToBack({ children }: { children: ReactNode }) {
    const token = useUserStore((state) => state.token);
    const roleType = useUserStore((state) => state.roleType);

    if (token && roleType === "2") {
        return <Navigate to="/back/dashboard" replace />;
    }

    return <>{children}</>;
}