import { useEffect, useState } from "react";

export const DEFAULT_DASHBOARD_THEME = "default" as const;
export type DashboardThemeScope = "admin" | "staff";

export const DASHBOARD_THEMES = [
    "light",
    "dark",
    "cupcake",
    "bumblebee",
    "emerald",
    "corporate",
    "synthwave",
    "retro",
    "cyberpunk",
    "valentine",
    "halloween",
    "garden",
    "forest",
    "aqua",
    "lofi",
    "pastel",
    "fantasy",
    "wireframe",
    "black",
    "luxury",
    "dracula",
    "cmyk",
    "autumn",
    "business",
    "acid",
    "lemonade",
    "night",
    "coffee",
    "winter",
    "dim",
    "nord",
    "sunset",
] as const;

export const DASHBOARD_THEME_OPTIONS = [
    DEFAULT_DASHBOARD_THEME,
    ...DASHBOARD_THEMES,
] as const;

export type DashboardTheme = (typeof DASHBOARD_THEME_OPTIONS)[number];

export const DASHBOARD_THEME_STORAGE_KEYS = {
    admin: "admin-dashboard-theme",
    staff: "staff-dashboard-theme",
} as const;
export const DASHBOARD_THEME_EVENTS = {
    admin: "admin-dashboard-theme-change",
    staff: "staff-dashboard-theme-change",
} as const;
export const THEMED_ADMIN_COMPONENTS = [
    "Admin/Dashboard/index",
    "Admin/Aiassistant/index",
    "Admin/Document/index",
    "Admin/ActivityLogs/index",
    "Admin/Account/index",
] as const;
export const THEMED_STAFF_COMPONENTS = [
    "Staff/Dashboard/index",
    "Staff/Aiassistant/index",
    "Staff/Documents/index",
] as const;

export const isThemedAdminComponent = (component: string) =>
    THEMED_ADMIN_COMPONENTS.includes(
        component as (typeof THEMED_ADMIN_COMPONENTS)[number]
    );
export const isThemedStaffComponent = (component: string) =>
    THEMED_STAFF_COMPONENTS.includes(
        component as (typeof THEMED_STAFF_COMPONENTS)[number]
    );
export const getDashboardThemeScopeForComponent = (
    component: string
): DashboardThemeScope =>
    component.startsWith("Staff/") ? "staff" : "admin";
export const isThemedComponentForScope = (
    component: string,
    scope: DashboardThemeScope = "admin"
) =>
    scope === "staff"
        ? isThemedStaffComponent(component)
        : isThemedAdminComponent(component);

const isDashboardTheme = (value: string | null): value is DashboardTheme =>
    value !== null && DASHBOARD_THEME_OPTIONS.includes(value as DashboardTheme);

export const getStoredDashboardTheme = (
    scope: DashboardThemeScope = "admin"
): DashboardTheme => {
    if (typeof window === "undefined") {
        return DEFAULT_DASHBOARD_THEME;
    }

    const storageKey = DASHBOARD_THEME_STORAGE_KEYS[scope];
    const storedTheme = window.localStorage.getItem(storageKey);

    return isDashboardTheme(storedTheme)
        ? storedTheme
        : DEFAULT_DASHBOARD_THEME;
};

export const setStoredDashboardTheme = (
    theme: DashboardTheme,
    scope: DashboardThemeScope = "admin"
) => {
    if (typeof window === "undefined") {
        return;
    }

    const storageKey = DASHBOARD_THEME_STORAGE_KEYS[scope];
    const eventName = DASHBOARD_THEME_EVENTS[scope];

    window.localStorage.setItem(storageKey, theme);
    window.dispatchEvent(
        new CustomEvent<DashboardTheme>(eventName, {
            detail: theme,
        })
    );
};

export const useDashboardTheme = (
    scope: DashboardThemeScope = "admin"
) => {
    const storageKey = DASHBOARD_THEME_STORAGE_KEYS[scope];
    const eventName = DASHBOARD_THEME_EVENTS[scope];
    const [theme, setTheme] = useState<DashboardTheme>(() =>
        getStoredDashboardTheme(scope)
    );

    useEffect(() => {
        const handleStorage = (event: StorageEvent) => {
            if (
                event.key === storageKey &&
                isDashboardTheme(event.newValue)
            ) {
                setTheme(event.newValue);
            }
        };

        const handleThemeChange = (event: Event) => {
            const customEvent = event as CustomEvent<DashboardTheme>;

            if (isDashboardTheme(customEvent.detail)) {
                setTheme(customEvent.detail);
            }
        };

        window.addEventListener("storage", handleStorage);
        window.addEventListener(eventName, handleThemeChange);

        return () => {
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener(eventName, handleThemeChange);
        };
    }, [eventName, storageKey]);

    const updateTheme = (nextTheme: DashboardTheme) => {
        setTheme(nextTheme);
        setStoredDashboardTheme(nextTheme, scope);
    };

    return { theme, setTheme: updateTheme };
};
