import React, { useRef, useEffect, useState } from 'react';
import { useCall } from '../context/CallContext';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  Monitor,
  Maximize2,
  Minimize2,
  MessageSquare,
  ShieldCheck,
  User,
} from 'lucide-react';
import { InCallChat } from './InCallChat';

export const VideoRoom = () => {
  const {
    callStatus,
    currentCall,
    localStream,
    remoteStream,
    isMicMuted,
    isVideoMuted,
    isScreenSharing,
    connectionQuality,
    callDuration,
    endCall,
    toggleMic,
    toggleVideo,
    toggleScreenShare,
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const roomContainerRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Format call duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      roomContainerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={roomContainerRef}
      className="relative w-full h-[calc(100vh-4.5rem)] bg-slate-950 flex overflow-hidden select-none"
    >
      {/* Main Video Area */}
      <div className="relative flex-1 h-full bg-slate-950 flex items-center justify-center overflow-hidden">
        
        {/* Remote Video (Other Person) */}
        {remoteStream && remoteStream.getVideoTracks().length > 0 ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover sm:object-contain bg-black"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-4">
              <User className="w-12 h-12 text-slate-400" />
            </div>
            <h4 className="text-lg font-semibold text-white">
              {currentCall?.receiverEmail || currentCall?.callerEmail || '2-tomon'}
            </h4>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {callStatus === 'connected' ? 'Google STUN orqali P2P aloqa o‘rnatildi' : 'Ulanmoqda...'}
            </p>
          </div>
        )}

        {/* Local Video (Self Picture-in-Picture) */}
        <div className="absolute top-4 right-4 z-20 w-36 h-24 sm:w-56 sm:h-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/80 bg-slate-900 group">
          {localStream && !isVideoMuted ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400">
              <VideoOff className="w-6 h-6 mb-1" />
              <span className="text-[10px]">Kamera o‘chirilgan</span>
            </div>
          )}

          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] text-white flex items-center gap-1">
            <span>Siz</span>
            {isMicMuted && <MicOff className="w-3 h-3 text-rose-400" />}
          </div>
        </div>

        {/* Call Info Overlay (Top Left) */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-800 px-3.5 py-1.5 rounded-full shadow-lg">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-medium text-slate-200">
            {formatDuration(callDuration)}
          </span>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1 text-[11px] text-indigo-300 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>STUN P2P</span>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 sm:gap-4 px-5 py-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl">
          {/* Mic Toggle */}
          <button
            onClick={toggleMic}
            title={isMicMuted ? 'Mikrofonni yoqish' : 'Mikrofonni o‘chirish'}
            className={`p-3 rounded-xl transition-all ${
              isMicMuted
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            title={isVideoMuted ? 'Kamerani yoqish' : 'Kamerani o‘chirish'}
            className={`p-3 rounded-xl transition-all ${
              isVideoMuted
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            title={isScreenSharing ? 'Ekranni to‘xtatish' : 'Ekranni ulashish'}
            className={`p-3 rounded-xl transition-all ${
              isScreenSharing
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* In-Call Chat */}
          <button
            onClick={() => setShowChat(!showChat)}
            title="Chat oynasi"
            className={`p-3 rounded-xl transition-all ${
              showChat
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Kichraytirish' : 'To‘liq ekran'}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all hidden sm:block"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {/* End Call Button */}
          <button
            onClick={endCall}
            title="Qo‘ng‘iroqni yakunlash"
            className="p-3 sm:px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-2 shadow-lg shadow-rose-600/40 active:scale-95 transition-all"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="text-xs font-semibold hidden sm:inline">Tugatish</span>
          </button>
        </div>
      </div>

      {/* In-call Chat Drawer */}
      {showChat && <InCallChat onClose={() => setShowChat(false)} />}
    </div>
  );
};
