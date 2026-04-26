import { useEffect, useRef, useState } from "react";
import { usePage } from "@inertiajs/react";
import { ChevronDown, Palette } from "lucide-react";
import {
    DASHBOARD_THEME_OPTIONS,
    DashboardTheme,
    DashboardThemeScope,
    DEFAULT_DASHBOARD_THEME,
    isThemedComponentForScope,
    useDashboardTheme,
} from "../../../hooks/useDashboardTheme";

const defaultThemeAccent = "from-green-700 via-emerald-600 to-yellow-300";
const themeAccents = [
    "from-emerald-400 via-green-500 to-lime-400",
    "from-sky-400 via-cyan-500 to-blue-500",
    "from-amber-300 via-orange-400 to-rose-400",
    "from-fuchsia-400 via-pink-500 to-rose-400",
    "from-indigo-400 via-violet-500 to-purple-500",
    "from-slate-500 via-gray-700 to-zinc-900",
] as const;

const formatThemeLabel = (theme: DashboardTheme) =>
    theme === DEFAULT_DASHBOARD_THEME
        ? "Default"
        : theme.charAt(0).toUpperCase() + theme.slice(1);

const getThemeAccent = (theme: DashboardTheme, index: number) =>
    theme === DEFAULT_DASHBOARD_THEME
        ? defaultThemeAccent
        : themeAccents[index % themeAccents.length];

interface ThemeDropdownProps {
    mode?: "preview" | "apply";
    scope?: DashboardThemeScope;
}

export default function ThemeDropdown({
    mode = "preview",
    scope = "admin",
}: ThemeDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { component } = usePage();
    const { theme: selectedTheme, setTheme } = useDashboardTheme(scope);
    const isApplyMode = mode === "apply";
    const isDashboardThemeEnabled =
        isThemedComponentForScope(component, scope) &&
        selectedTheme !== DEFAULT_DASHBOARD_THEME;

    const handleThemeSelect = (theme: DashboardTheme) => {
        if (!isApplyMode) {
            return;
        }

        setTheme(theme);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div
            data-theme={isDashboardThemeEnabled ? selectedTheme : undefined}
            className="relative"
            ref={containerRef}
        >
            <button
                type="button"
                title="Theme list"
                aria-label="Theme list"
                onClick={() => setIsOpen((current) => !current)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 transition-all duration-200 ${
                    isDashboardThemeEnabled
                        ? "border border-base-300/80 bg-base-100 text-base-content shadow-lg shadow-base-content/5 hover:border-primary/20 hover:text-primary"
                        : "text-base-content hover:text-primary"
                }`}
                style={
                    isDashboardThemeEnabled
                        ? undefined
                        : {
                              background: "rgba(255, 255, 255, 0.4)",
                              backdropFilter: "blur(15px)",
                              WebkitBackdropFilter: "blur(15px)",
                              border: "1px solid rgba(255, 255, 255, 0.5)",
                              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
                          }
                }
            >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-primary-content shadow-sm">
                    <Palette className="h-4 w-4" />
                </div>

                <div className="hidden min-w-0 text-left lg:block">
                    <p className="text-sm font-semibold text-base-content">
                        Theme
                    </p>
                    <p className="text-[11px] text-base-content/60">
                        {isApplyMode
                            ? formatThemeLabel(selectedTheme)
                            : `${DASHBOARD_THEME_OPTIONS.length} presets`}
                    </p>
                </div>

                <ChevronDown
                    className={`h-4 w-4 text-base-content/50 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                    }`}
                />
            </button>

            {isOpen && (
                <div
                    className={`absolute right-0 top-full z-[90] mt-3 w-[22rem] overflow-hidden rounded-2xl ${
                        isDashboardThemeEnabled
                            ? "border border-base-300 bg-base-100 shadow-2xl shadow-base-content/10"
                            : ""
                    }`}
                    style={
                        isDashboardThemeEnabled
                            ? undefined
                            : {
                                  background: "rgba(255, 255, 255, 0.96)",
                                  backdropFilter: "blur(24px)",
                                  WebkitBackdropFilter: "blur(24px)",
                                  border: "1px solid rgba(255, 255, 255, 0.65)",
                                  boxShadow:
                                      "0 14px 40px rgba(15, 23, 42, 0.14)",
                              }
                    }
                >
                    <div className="border-b border-base-300/70 px-4 py-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-base-content">
                                    Theme Library
                                </p>
                                <p className="text-xs text-base-content/60">
                                    {isApplyMode
                                        ? "Includes your original dashboard style"
                                        : "UI preview only for now"}
                                </p>
                            </div>
                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                                {DASHBOARD_THEME_OPTIONS.length} themes
                            </span>
                        </div>
                    </div>

                    <div data-lenis-prevent className="max-h-[22rem] overflow-y-auto p-3">
                        <div className="grid grid-cols-2 gap-2">
                            {DASHBOARD_THEME_OPTIONS.map((theme, index) => {
                                const isSelected =
                                    isApplyMode && selectedTheme === theme;

                                return (
                                    <button
                                        key={theme}
                                        type="button"
                                        onClick={() => handleThemeSelect(theme)}
                                        className={`group flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                                            isSelected
                                                ? "border-primary/25 bg-primary/10 shadow-sm"
                                                : "border-transparent bg-base-100/75 hover:border-primary/15 hover:bg-base-200/80"
                                        }`}
                                    >
                                        <div
                                            className={`relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br ${getThemeAccent(
                                                theme,
                                                index
                                            )} shadow-sm`}
                                        >
                                            <div className="absolute inset-[1px] rounded-[10px] bg-white/12" />
                                            <div className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-white/30 blur-sm" />
                                            <div className="absolute bottom-1 left-1 h-3 w-3 rounded-full bg-white/25" />
                                        </div>

                                        <div className="min-w-0">
                                            <p
                                                className={`truncate text-sm font-semibold ${
                                                    isSelected
                                                        ? "text-primary"
                                                        : "text-base-content group-hover:text-primary"
                                                }`}
                                            >
                                                {formatThemeLabel(theme)}
                                            </p>
                                            <p className="truncate text-[11px] uppercase tracking-[0.18em] text-base-content/45">
                                                {theme}
                                            </p>
                                        </div>

                                        {isSelected && (
                                            <span className="ml-auto rounded-full bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-content">
                                                Active
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
