import React from 'react';
import { useCall } from '../context/CallContext';
import { Phone, PhoneOff, Video, User } from 'lucide-react';

export const IncomingCallModal = () => {
  const { callStatus, incomingCallData, acceptIncomingCall, rejectIncomingCall } = useCall();

  if (callStatus !== 'incoming' || !incomingCallData) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden animate-ring-pulse">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Caller Avatar */}
        <div className="relative mx-auto w-24 h-24 mb-5">
          <div className="absolute inset-0 rounded-full bg-indigo-500/30 animate-ping" />
          <div className="relative w-full h-full rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 border-2 border-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/50">
            <User className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
            <Video className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Caller info */}
        <h3 className="text-xl font-bold text-white">
          {incomingCallData.callerName || 'Foydalanuvchi'}
        </h3>
        <p className="text-xs text-indigo-300 font-mono mt-1">
          {incomingCallData.callerEmail}
        </p>
        <p className="text-xs text-slate-400 mt-2 flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Kiruvchi P2P video qo‘ng‘iroq...
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6 mt-8">
          {/* Reject button */}
          <button
            onClick={rejectIncomingCall}
            className="group flex flex-col items-center gap-2 focus:outline-none"
          >
            <div className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transform active:scale-95 transition-all">
              <PhoneOff className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-medium text-rose-300">Rad etish</span>
          </button>

          {/* Accept button */}
          <button
            onClick={acceptIncomingCall}
            className="group flex flex-col items-center gap-2 focus:outline-none"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 transform active:scale-95 transition-all animate-bounce">
              <Phone className="w-7 h-7" />
            </div>
            <span className="text-[11px] font-medium text-emerald-300">Qabul qilish</span>
          </button>
        </div>
      </div>
    </div>
  );
};
