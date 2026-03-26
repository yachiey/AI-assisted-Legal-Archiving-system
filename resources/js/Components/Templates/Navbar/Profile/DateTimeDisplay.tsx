import { FC, useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";
import { Calendar as CalendarIcon } from "lucide-react";
import Calendar from "./Calendar";
import {
    DEFAULT_DASHBOARD_THEME,
    getDashboardThemeScopeForComponent,
    isThemedComponentForScope,
    useDashboardTheme,
} from "../../../../hooks/useDashboardTheme";

const DateTimeDisplay: FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const { component } = usePage();
    const scope = getDashboardThemeScopeForComponent(component);
    const { theme } = useDashboardTheme(scope);
    const isDashboardThemeEnabled =
        isThemedComponentForScope(component, scope) &&
        theme !== DEFAULT_DASHBOARD_THEME;

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentDate(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatDay = (date: Date): string =>
        date.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();

    const formatDate = (date: Date): string =>
        date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });

    return (
        <>
            <div
                data-theme={isDashboardThemeEnabled ? theme : undefined}
                className={`relative z-20 flex shrink-0 items-center space-x-3 rounded-xl border px-4 py-2 ${
                    isDashboardThemeEnabled
                        ? "border-base-300/80 bg-base-100 text-base-content shadow-lg shadow-base-content/5"
                        : ""
                }`}
                style={
                    isDashboardThemeEnabled
                        ? undefined
                        : {
                              background: "rgba(255, 255, 255, 0.4)",
                              backdropFilter: "blur(15px)",
                              WebkitBackdropFilter: "blur(15px)",
                              borderColor: "rgba(255, 255, 255, 0.5)",
                              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
                          }
                }
            >
                <div className="min-w-0 text-center">
                    <div
                        className={`text-lg font-bold tracking-wide ${
                            isDashboardThemeEnabled
                                ? "text-base-content"
                                : "text-gray-900"
                        }`}
                    >
                        {formatDay(currentDate)}
                    </div>
                    <div
                        className={`text-sm font-medium ${
                            isDashboardThemeEnabled
                                ? "text-base-content/65"
                                : "text-gray-700"
                        }`}
                    >
                        {formatDate(currentDate)}
                    </div>
                </div>
                <button
                    onClick={() => setIsCalendarOpen((current) => !current)}
                    className={`relative z-10 transition-colors ${
                        isDashboardThemeEnabled
                            ? "text-primary hover:text-secondary"
                            : "text-green-600 hover:text-green-800"
                    }`}
                >
                    <CalendarIcon size={20} />
                </button>
            </div>

            <Calendar
                isOpen={isCalendarOpen}
                onClose={() => setIsCalendarOpen(false)}
            />
        </>
    );
};

export default DateTimeDisplay;
