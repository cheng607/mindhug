import { useNavigate } from 'react-router-dom';
import { useUserStore } from './store/userStore';
import { useEffect } from 'react';
import Auth from './pages/Auth';

function App() {
  const userInfo = useUserStore(state => state.userInfo);
  const roleType = useUserStore(state => state.roleType);
  const navigate = useNavigate();
  //  添加加载状态，避免初始状态误判


  useEffect(() => {
    const checkRoleAndRedirect = () => {
      try {
        // 未登录：跳转到登录页
        if (!userInfo) {
          navigate('/auth', { replace: true });
        } else {
          // 已登录：根据角色跳转
          switch (roleType) {
            case '2': // 管理员角色
              navigate('/back', { replace: true });
              break;
            case '1': // 普通用户角色
              navigate('/user', { replace: true });
              break;
            default: // 未知角色：跳转到403或登录页
              navigate('*', { replace: true });
              console.warn('未知角色类型:', roleType);
          }
        }
      } catch (error) {
        console.error('路由鉴权失败:', error);
        navigate('/auth', { replace: true });
      }
    };
    const timer = setTimeout(() => {
      checkRoleAndRedirect();
    }, 100);

    // 清除定时器
    return () => clearTimeout(timer);
  }, [userInfo, roleType, navigate]);

  return (
    <div className='h-[100vh]'>
      {!userInfo ? <Auth /> : null}
    </div>
  );
}

export default App;