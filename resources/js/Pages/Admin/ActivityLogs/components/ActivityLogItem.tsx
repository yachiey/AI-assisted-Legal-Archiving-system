import React from "react";
import {
    DEFAULT_DASHBOARD_THEME,
    useDashboardTheme,
} from "../../../../hooks/useDashboardTheme";

interface Activity {
    action: string;
    document: string;
    user: string;
    time: string;
}

interface ActivityLogItemProps {
    activity: Activity;
}

const ActivityLogItem: React.FC<ActivityLogItemProps> = ({ activity }) => {
    const { theme } = useDashboardTheme();
    const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

    return (
        <div
            data-theme={isDashboardThemeEnabled ? theme : undefined}
            className={`p-4 transition-all duration-200 ${
                isDashboardThemeEnabled ? 'hover:bg-base-200/70' : 'hover:bg-white/5'
            }`}
        >
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                    <div
                        className={`mt-2 h-2 w-2 rounded-full shadow-sm ${
                            isDashboardThemeEnabled ? 'bg-primary' : ''
                        }`}
                        style={isDashboardThemeEnabled ? undefined : { background: '#FBEC5D' }}
                    ></div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <p className={`mb-1 font-semibold ${
                                isDashboardThemeEnabled ? 'text-base-content' : 'text-white'
                            }`}>{activity.action}</p>
                            {activity.document && (
                                <p className={`mb-1 truncate text-sm font-normal ${
                                    isDashboardThemeEnabled ? 'text-base-content/75' : 'text-white/80'
                                }`}>
                                    {activity.document}
                                </p>
                            )}
                            <p className={`text-xs font-normal ${
                                isDashboardThemeEnabled ? 'text-base-content/55' : 'text-white/60'
                            }`}>by {activity.user}</p>
                        </div>
                        <span className={`whitespace-nowrap text-xs font-normal ${
                            isDashboardThemeEnabled ? 'text-base-content/50' : 'text-white/50'
                        }`}>
                            {activity.time}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityLogItem;
