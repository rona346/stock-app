import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  LineChart,
  PieChart,
  Star,
  Settings,
  LogOut,
  TrendingUp,
  ClipboardList,
} from "lucide-react";
import { motion } from "motion/react";

interface SidebarProps {
  onLogout: () => void;
  onResetAccount: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onLogout,
  onResetAccount,
}) => {
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Market", icon: LineChart, path: "/market" },
    { name: "Portfolio", icon: PieChart, path: "/portfolio" },
    { name: "Orders", icon: ClipboardList, path: "/orders" },
    { name: "Watchlist", icon: Star, path: "/watchlist" },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center space-x-3">
        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <TrendingUp className="text-white w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
          StockAI
        </h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <item.icon
                className={`w-5 h-5 ${isActive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 group-hover:text-gray-600"}`}
              />
              <span>{item.name}</span>
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={onResetAccount}
          className="flex items-center space-x-3 w-full px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 rounded-xl transition-all duration-200"
        >
          <span className="text-lg">↻</span>
          <span>Reset Account</span>
        </button>
        
        <button
          onClick={onLogout}
          className="flex items-center space-x-3 w-full px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};
