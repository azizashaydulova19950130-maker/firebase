import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Video, LogOut, User, ShieldCheck } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                WebRTC P2P Video
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Google STUN
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-0.5">Firebase Signalling & P2P Stream</p>
          </div>
        </div>

        {/* User Profile & Logout */}
        {user && (
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <div className="flex flex-col text-left">
                <span className="font-medium text-slate-200">{user.displayName || 'Foydalanuvchi'}</span>
                <span className="text-[10px] text-slate-400">{user.email}</span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Tizimdan chiqish"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-rose-500/20 hover:border-rose-500/30 border border-slate-700 transition-all duration-200"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">Chiqish</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
