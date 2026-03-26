import React from 'react';
import ThemeDropdown from '../../../../../Components/Templates/Navbar/ThemeDropdown';
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from '../../../../../hooks/useDashboardTheme';

interface HeaderProps {
  currentSessionTitle?: string;
  onUpload: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentSessionTitle, onUpload }) => {
  const { theme } = useDashboardTheme('staff');
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

  return (
    <div
      className={`${
        isDashboardThemeEnabled
          ? 'border-b border-base-300/70 bg-base-100/85 text-base-content backdrop-blur-xl'
          : 'bg-white border-b border-gray-200'
      }`}
    >
      <div className="px-8 py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-5">
            {/* Icon Container */}
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${
                isDashboardThemeEnabled
                  ? 'bg-gradient-to-br from-primary to-secondary text-primary-content'
                  : 'bg-gradient-to-br from-[#228B22] to-[#1a6b1a] text-white'
              }`}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>

            {/* Title */}
            <div>
              <h1
                className={`text-2xl font-bold truncate max-w-md ${
                  isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-900'
                }`}
              >
                {currentSessionTitle || 'AI Assistant'}
              </h1>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center space-x-3">
            <ThemeDropdown mode="apply" scope="staff" />
            <div
              className={`px-4 py-2 rounded-full border flex items-center space-x-2 ${
                isDashboardThemeEnabled
                  ? 'bg-base-200/80 border-base-300 text-base-content'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="relative">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    isDashboardThemeEnabled ? 'bg-primary' : 'bg-[#228B22]'
                  }`}
                ></div>
                <div
                  className={`absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping opacity-75 ${
                    isDashboardThemeEnabled ? 'bg-primary' : 'bg-[#228B22]'
                  }`}
                ></div>
              </div>
              <span
                className={`text-sm font-semibold hidden sm:block ${
                  isDashboardThemeEnabled ? 'text-base-content/80' : 'text-gray-700'
                }`}
              >
                Ready
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
