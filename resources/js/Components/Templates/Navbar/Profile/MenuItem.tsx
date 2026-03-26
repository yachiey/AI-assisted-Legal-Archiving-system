import React from "react";
import { usePage } from "@inertiajs/react";
import { MenuItemProps } from "../../../../Types/profile_types";
import {
    DEFAULT_DASHBOARD_THEME,
    getDashboardThemeScopeForComponent,
    isThemedComponentForScope,
    useDashboardTheme,
} from "../../../../hooks/useDashboardTheme";

const MenuItem: React.FC<MenuItemProps> = ({
    icon,
    label,
    onClick,
    variant = "default",
}) => {
    const { component } = usePage();
    const scope = getDashboardThemeScopeForComponent(component);
    const { theme } = useDashboardTheme(scope);
    const isDashboardThemeEnabled =
        isThemedComponentForScope(component, scope) &&
        theme !== DEFAULT_DASHBOARD_THEME;

    const getHoverClasses = () => {
        if (variant === "danger") {
            return isDashboardThemeEnabled
                ? "text-error hover:bg-error/10 hover:text-error"
                : "text-red-600 hover:bg-red-50 hover:text-red-700";
        }

        return isDashboardThemeEnabled
            ? "text-base-content/75 hover:bg-base-200 hover:text-base-content"
            : "text-gray-700 hover:bg-gray-50 hover:text-black";
    };

    return (
        <button
            onClick={onClick}
            className={`flex w-full items-center rounded-lg px-4 py-2 transition-all duration-200 ease-in-out ${getHoverClasses()}`}
        >
            {icon}
            <span className="ml-3 text-sm">{label}</span>
        </button>
    );
};

export default MenuItem;
