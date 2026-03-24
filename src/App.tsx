import { Outlet, useNavigate } from "react-router-dom";
import { useUserStore } from "./store/userStore";
import { useEffect } from "react";


function App() {
  const userInfo = useUserStore(state => state.userInfo);
  const roleType = useUserStore(state => state.roleType);
  const token = useUserStore(state => state.token);
  const navigate = useNavigate();

  // 应用启动时确保用户状态正确初始化
  useEffect(() => {
    // 检查localStorage和store状态是否一致
    const storedToken = localStorage.getItem('token');
    const hasTokenInStore = !!token;

    if (storedToken && !hasTokenInStore) {
      console.log('User state mismatch, reloading page to reinitialize...');
      // 如果localStorage有token但store没有，刷新页面重新初始化
      window.location.reload();
    }
  }, [token]);

  useEffect(() => {
    const checkRoleAndRedirect = () => {
      const currentPath = window.location.pathname;

      // 该组件只用于 /user 路径首次进入时的角色跳转；手动修改 URL 不应触发重定向
      if (currentPath !== '/user') return;

      if (!userInfo) {
        // 未登录：跳登录页
        navigate('/auth/login', { replace: true });
      } else {
        // 已登录：根据角色跳转到对应的后台/前台（普通用户跳回首页）
        if (roleType === '2') {
          navigate('/back', { replace: true });
        } else if (roleType === '1') {
          navigate('/', { replace: true });
        }
      }
    };
    checkRoleAndRedirect();
  }, [userInfo, roleType, navigate]);

  return (
    <div className='h-[100vh]'>
      <Outlet />
    </div>
  );
}

export default App;