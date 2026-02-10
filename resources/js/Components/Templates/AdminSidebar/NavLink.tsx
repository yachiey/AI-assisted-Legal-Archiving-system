import { Home, Bot, FileText, Users2, LogOut, Activity, User } from "lucide-react";
import React from "react";



export const navLinksData = [
    {
        title: "Dashboard",
        path: "/admin/dashboard",
        icon: <Home size={18} />,
    },

    {
        title: "AI Assistant",
        path: "/admin/ai-assistant",
        icon: <Bot size={18} />,
    },
    {
        title: "Documents",
        path: "/admin/documents",
        icon: <FileText size={18} />,
    },
    {
        title: "Activity Logs",
        path: "/admin/activity-logs",
        icon: <Activity size={18} />,
    },
    {
        title: "Account Management",
        path: "/admin/account",
        icon: <User size={18} />,
    },
];
