import { FC, useState } from "react";
import { usePage } from "@inertiajs/react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
    DEFAULT_DASHBOARD_THEME,
    getDashboardThemeScopeForComponent,
    isThemedComponentForScope,
    useDashboardTheme,
} from "../../../../hooks/useDashboardTheme";

interface CalendarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Calendar: FC<CalendarProps> = ({ isOpen, onClose }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const { component } = usePage();
    const scope = getDashboardThemeScopeForComponent(component);
    const { theme } = useDashboardTheme(scope);
    const isDashboardThemeEnabled =
        isThemedComponentForScope(component, scope) &&
        theme !== DEFAULT_DASHBOARD_THEME;

    if (!isOpen) return null;

    const today = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay();

    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const calendarDays = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
    }

    const navigateMonth = (direction: "prev" | "next") => {
        setCurrentDate((prev) => {
            const newDate = new Date(prev);
            newDate.setMonth(
                direction === "prev"
                    ? prev.getMonth() - 1
                    : prev.getMonth() + 1
            );
            return newDate;
        });
    };

    const isToday = (day: number) =>
        day === today.getDate() &&
        currentMonth === today.getMonth() &&
        currentYear === today.getFullYear();

    const modalContent = (
        <div
            data-theme={isDashboardThemeEnabled ? theme : undefined}
            className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${
                    isDashboardThemeEnabled
                        ? "border border-base-300 bg-base-100 text-base-content"
                        : ""
                }`}
                onClick={(e) => e.stopPropagation()}
                style={
                    isDashboardThemeEnabled
                        ? undefined
                        : {
                              background:
                                  "linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.25) 100%)",
                              backdropFilter: "blur(40px) saturate(180%)",
                              WebkitBackdropFilter:
                                  "blur(40px) saturate(180%)",
                              border: "1px solid rgba(255, 255, 255, 0.4)",
                              boxShadow:
                                  "0 10px 40px 0 rgba(100, 116, 139, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.3)",
                          }
                }
            >
                <div
                    className={`mb-4 flex items-center justify-between border-b pb-3 ${
                        isDashboardThemeEnabled
                            ? "border-base-300"
                            : "border-white/30"
                    }`}
                >
                    <h2
                        className={`text-xl font-semibold ${
                            isDashboardThemeEnabled
                                ? "text-base-content"
                                : "text-white/90"
                        }`}
                    >
                        {monthNames[currentMonth]} {currentYear}
                    </h2>
                    <button
                        onClick={onClose}
                        className={`rounded-lg p-1 transition-all ${
                            isDashboardThemeEnabled
                                ? "text-base-content/60 hover:bg-base-200 hover:text-base-content"
                                : "text-white/70 hover:bg-white/20 hover:text-white/90"
                        }`}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mb-4 flex items-center justify-between">
                    <button
                        onClick={() => navigateMonth("prev")}
                        className={`rounded-full p-2 transition-all ${
                            isDashboardThemeEnabled
                                ? "hover:bg-base-200"
                                : "hover:bg-white/20"
                        }`}
                    >
                        <ChevronLeft
                            size={20}
                            className={
                                isDashboardThemeEnabled
                                    ? "text-base-content/80"
                                    : "text-white/80"
                            }
                        />
                    </button>

                    <div
                        className={`text-lg font-medium ${
                            isDashboardThemeEnabled
                                ? "text-base-content"
                                : "text-white/90"
                        }`}
                    >
                        {monthNames[currentMonth]} {currentYear}
                    </div>

                    <button
                        onClick={() => navigateMonth("next")}
                        className={`rounded-full p-2 transition-all ${
                            isDashboardThemeEnabled
                                ? "hover:bg-base-200"
                                : "hover:bg-white/20"
                        }`}
                    >
                        <ChevronRight
                            size={20}
                            className={
                                isDashboardThemeEnabled
                                    ? "text-base-content/80"
                                    : "text-white/80"
                            }
                        />
                    </button>
                </div>

                <div className="mb-2 grid grid-cols-7">
                    {dayNames.map((day) => (
                        <div
                            key={day}
                            className={`py-2 text-center text-sm font-medium ${
                                isDashboardThemeEnabled
                                    ? "text-base-content/65"
                                    : "text-white/75"
                            }`}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => (
                        <div
                            key={index}
                            className="flex h-10 items-center justify-center"
                        >
                            {day && (
                                <button
                                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all ${
                                        isToday(day)
                                            ? isDashboardThemeEnabled
                                                ? "bg-primary text-primary-content shadow-lg shadow-primary/25"
                                                : "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:from-green-600 hover:to-emerald-700"
                                            : isDashboardThemeEnabled
                                              ? "text-base-content/80 hover:bg-base-200 hover:text-base-content"
                                              : "text-white/85 hover:bg-white/20 hover:text-white/95"
                                    }`}
                                >
                                    {day}
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div
                    className={`mt-4 border-t pt-4 ${
                        isDashboardThemeEnabled
                            ? "border-base-300"
                            : "border-white/30"
                    }`}
                >
                    <div
                        className={`text-center text-sm font-medium ${
                            isDashboardThemeEnabled
                                ? "text-base-content/70"
                                : "text-white/85"
                        }`}
                    >
                        Today:{" "}
                        {today.toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default Calendar;
