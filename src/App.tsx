import { Outlet, useNavigate } from "react-router-dom";
import { useUserStore } from "./store/userStore";
import { useEffect } from "react";


function App() {
  const userInfo = useUserStore(state => state.userInfo);
  const roleType = useUserStore(state => state.roleType);
  const navigate = useNavigate();

  useEffect(() => {
    const checkRoleAndRedirect = () => {
      const currentPath = window.location.pathname;
      if (currentPath !== '/user') return;

      if (!userInfo) {
        navigate('/auth/login', { replace: true });
      } else {
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
