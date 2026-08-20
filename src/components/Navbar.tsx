import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, User, Moon, Sun, Wallet, LogOut, Settings, UserCircle, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  notifications: string[];
  onClearNotifications: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  user, 
  isDarkMode, 
  toggleDarkMode, 
  searchQuery, 
  onSearchChange, 
  notifications, 
  onClearNotifications,
  onLogout
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [imgError, setImgError] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const hasPhoto = user?.photoURL && !imgError;

  return (
    <header className="h-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search stocks, indices, or news..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white"
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="hidden md:flex items-center bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
          <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mr-2" />
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">₹{user?.balance.toLocaleString() ?? '0'}</span>
        </div>

        <button 
          onClick={toggleDarkMode}
          className="p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 relative"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-gray-900"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                <button onClick={onClearNotifications} className="text-xs text-emerald-500 font-bold hover:underline">Clear All</button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">No new notifications</div>
                ) : (
                  notifications.map((note, i) => (
                    <div key={i} className="p-4 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <p className="text-sm text-gray-800 dark:text-gray-200">{note}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Clickable Profile Section */}
        <div className="relative" ref={profileMenuRef}>
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-gray-800 hover:opacity-80 transition-opacity focus:outline-none"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-900 dark:text-white text-left">{user?.displayName || 'Investor'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-left">Pro Trader</p>
            </div>
            {hasPhoto ? (
              <img 
                src={user?.photoURL} 
                alt={user?.displayName || 'User'} 
                className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-emerald-500/20 border border-emerald-500/10"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20">
                {user?.displayName?.[0] || <User className="w-6 h-6" />}
              </div>
            )}
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
              {/* Header section with User Info */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-1">Signed In As</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.displayName || 'Investor'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">{user?.email}</p>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pro Trader</span>
                </div>
              </div>

              {/* Menu options */}
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => {
                    setShowProfileModal(true);
                    setShowProfileMenu(false);
                  }}
                  className="flex items-center space-x-3 w-full px-3.5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors text-left"
                >
                  <UserCircle className="w-4 h-4 text-gray-400" />
                  <span>My Profile</span>
                </button>

                <button
                  onClick={() => {
                    alert("Account Settings are managed in your security center. (Placeholder)");
                    setShowProfileMenu(false);
                  }}
                  className="flex items-center space-x-3 w-full px-3.5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors text-left"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  <span>Account Settings</span>
                </button>

                {/* Theme Selection Toggle */}
                <button
                  onClick={() => {
                    toggleDarkMode();
                  }}
                  className="flex items-center justify-between w-full px-3.5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                    <span>Theme</span>
                  </div>
                  <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                    {isDarkMode ? 'Dark' : 'Light'}
                  </span>
                </button>
              </div>

              {/* Logout Option */}
              <div className="p-1.5 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                  className="flex items-center space-x-3 w-full px-3.5 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Detail Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white relative">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <UserCircle className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold uppercase tracking-wider text-xs">Profile Details</span>
                </div>
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center transition-colors focus:outline-none"
                >
                  ✕
                </button>
              </div>

              <div className="mt-6 flex items-center space-x-4">
                {hasPhoto ? (
                  <img 
                    src={user?.photoURL} 
                    alt={user?.displayName || 'User'} 
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-white/40 shadow-lg"
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-16 h-16 bg-white text-emerald-600 font-black text-2xl rounded-2xl flex items-center justify-center shadow-lg">
                    {user?.displayName?.[0] || 'U'}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-black">{user?.displayName || 'Investor'}</h3>
                  <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 bg-white/20 text-white rounded-full text-xs font-bold mt-1">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                    <span>Pro Trader Badge</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Full Name</span>
                <p className="text-sm font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 rounded-xl border border-gray-100/50 dark:border-gray-800/50">
                  {user?.displayName || 'Not Provided'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Email Address</span>
                <p className="text-sm font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 rounded-xl border border-gray-100/50 dark:border-gray-800/50 truncate">
                  {user?.email}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Balance</span>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/5 px-4 py-2.5 rounded-xl border border-emerald-100/20 dark:border-emerald-500/10">
                    ₹{user?.balance.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">Member Since</span>
                  <p className="text-sm font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 rounded-xl border border-gray-100/50 dark:border-gray-800/50">
                    {user?.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 dark:bg-gray-800/30 p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button
                onClick={() => setShowProfileModal(false)}
                className="bg-gray-900 dark:bg-gray-800 text-white hover:bg-gray-800 dark:hover:bg-gray-700 font-bold py-2.5 px-6 rounded-xl transition-all shadow-md focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
