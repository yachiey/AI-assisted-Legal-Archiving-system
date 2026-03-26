import { FC, useContext } from 'react';
import { usePage } from '@inertiajs/react';
import { DashboardContext } from '../../../Context/DashboardContext';
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from '../../../hooks/useDashboardTheme';

interface User {
  firstname?: string;
  name?: string;
}

interface PageProps {
  user?: User;
  auth?: {
    user?: User;
  };
  [key: string]: any;
}

const StaffHeader: FC = () => {
  const dashboardContext = useContext(DashboardContext);
  const collapsed = dashboardContext?.collapse;
  const pageData = usePage<PageProps>();
  const { theme } = useDashboardTheme('staff');
  const user = pageData.props.user || pageData.props.auth?.user;
  const userName = user?.firstname || user?.name || 'User';
  const isDashboardThemeEnabled =
    pageData.component === 'Staff/Dashboard/index' &&
    theme !== DEFAULT_DASHBOARD_THEME;

  return (
    <div
      className={`w-full rounded-b-3xl shadow-lg ${
        isDashboardThemeEnabled
          ? 'bg-gradient-to-br from-primary via-primary to-secondary text-primary-content'
          : ''
      }`}
      style={
        isDashboardThemeEnabled
          ? undefined
          : {
              background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)',
            }
      }
    >
      <div className={`transition-all duration-300 ${
        collapsed ? 'px-4 py-5' : 'px-8 py-6'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex-shrink-0">
            <div className="relative">
              <h1 className={`mb-2 font-bold transition-all duration-300 tracking-wide ${
                collapsed ? 'text-2xl' : 'text-3xl'
              } ${isDashboardThemeEnabled ? 'text-primary-content' : 'text-white'}`}
              style={{
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                HELLO, {userName.toUpperCase()}!
              </h1>
              <div className={`h-1 rounded-full transition-all duration-300 ${
                collapsed ? 'w-40' : 'w-64'
              } ${
                isDashboardThemeEnabled
                  ? 'bg-gradient-to-r from-accent to-transparent'
                  : 'bg-gradient-to-r from-yellow-400 to-transparent'
              }`}></div>
            </div>
            <p className={`mt-3 font-medium transition-all duration-300 ${
              collapsed ? 'text-sm' : 'text-base'
            } ${isDashboardThemeEnabled ? 'text-primary-content/85' : 'text-white/90'}`}
            style={{
              letterSpacing: '0.05em'
            }}>
              WELCOME BACK TO YOUR{' '}
              <span
                className={`font-bold ${
                  isDashboardThemeEnabled ? 'text-accent' : 'text-yellow-300'
                }`}
              >
                DASHBOARD
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffHeader;
