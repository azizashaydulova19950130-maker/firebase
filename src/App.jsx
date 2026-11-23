import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CallProvider, useCall } from './context/CallContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';
import { VideoRoom } from './components/VideoRoom';
import { IncomingCallModal } from './components/IncomingCallModal';

const MainContent = () => {
  const { user, loading } = useAuth();
  const { callStatus } = useCall();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-400">Yuklanmoqda...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <AuthModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <IncomingCallModal />
      {callStatus === 'connected' ? (
        <VideoRoom />
      ) : (
        <main className="flex-1">
          <Dashboard />
        </main>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CallProvider>
        <MainContent />
      </CallProvider>
    </AuthProvider>
  );
}
