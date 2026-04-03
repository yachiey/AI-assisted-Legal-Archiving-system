import React from "react";
import { Search, Filter } from "lucide-react";
import { SearchBarProps } from "../../types/types";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../../hooks/useDashboardTheme";

const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  onFilterClick,
}) => {
  const { theme } = useDashboardTheme("staff");
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

  const handleSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    onSearchChange(event.target.value);
  };

  return (
    <div className="relative z-0 mb-6 flex items-center gap-4">
      <div
        className={`flex-1 relative rounded-lg overflow-hidden ${
          isDashboardThemeEnabled
            ? "bg-base-100 border border-base-300 shadow-sm"
            : "bg-white shadow-sm border border-gray-200"
        }`}
      >
        <Search
          className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
            isDashboardThemeEnabled ? "text-base-content/40" : "text-gray-400"
          }`}
        />
        <input
          type="text"
          placeholder="Search documents, cases, agreements..."
          value={searchTerm}
          onChange={handleSearchChange}
          className={`w-full pl-12 pr-4 py-3 bg-transparent border-0 focus:outline-none focus:ring-2 font-normal ${
            isDashboardThemeEnabled
              ? "focus:ring-primary/20 focus:border-primary text-base-content placeholder:text-base-content/40"
              : "focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400"
          }`}
        />
      </div>
      <button
        onClick={onFilterClick}
        className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md ${
          isDashboardThemeEnabled
            ? "bg-base-100 border border-base-300 text-base-content hover:bg-base-200"
            : "bg-white border border-gray-200 hover:bg-gray-50"
        }`}
        type="button"
      >
        <Filter
          className={`w-5 h-5 ${
            isDashboardThemeEnabled ? "text-primary" : "text-gray-600"
          }`}
        />
        <span
          className={`font-medium ${
            isDashboardThemeEnabled ? "text-base-content" : "text-gray-700"
          }`}
        >
          Filter
        </span>
      </button>
    </div>
  );
};

export default SearchBar;

