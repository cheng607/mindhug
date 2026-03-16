import { Outlet, useNavigate } from "react-router-dom";
import { useUserStore } from "./store/userStore";
import { useEffect } from "react";


function App() {
  const userInfo = useUserStore(state => state.userInfo);
  const roleType = useUserStore(state => state.roleType);
  const navigate = useNavigate();

  useEffect(() => {
    const checkRoleAndRedirect = () => {
      if (!userInfo) {
        // 未登录：跳登录页
        if (window.location.pathname !== '/auth/login' && window.location.pathname !== '/auth/register') {
          navigate('/auth/login', { replace: true });
        }
      } else {
        // 已登录：避免重复跳转
        const currentPath = window.location.pathname;
        if (roleType === '2' && !currentPath.startsWith('/back')) {
          navigate('/back', { replace: true });
        } else if (roleType === '1' && !currentPath.startsWith('/home')) {
          navigate('/home', { replace: true });
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