import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import {
  Phone,
  PhoneCall,
  Video,
  Mail,
  User,
  ShieldCheck,
  Camera,
  CameraOff,
  AlertCircle,
  Wifi,
  Sparkles,
  PhoneOff,
} from 'lucide-react';
import { getUserMediaStream } from '../services/webrtc';

export const Dashboard = () => {
  const { user } = useAuth();
  const {
    callStatus,
    currentCall,
    startCall,
    endCall,
    callError,
    setCallError,
  } = useCall();

  const [targetEmail, setTargetEmail] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [previewStream, setPreviewStream] = useState(null);
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const previewVideoRef = useRef(null);

  // Fetch registered users in real-time
  useEffect(() => {
    const usersCol = collection(db, 'users');
    const unsubscribe = onSnapshot(
      usersCol,
      (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.email && data.email !== user?.email?.toLowerCase()) {
            list.push({ id: doc.id, ...data });
          }
        });
        setUsersList(list);
      },
      (err) => {
        console.warn('Foydalanuvchilar ro‘yxatini yuklashda ogohlantirish:', err.message);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Handle local camera preview
  const togglePreview = async () => {
    if (isPreviewActive) {
      if (previewStream) {
        previewStream.getTracks().forEach((track) => track.stop());
      }
      setPreviewStream(null);
      setIsPreviewActive(false);
    } else {
      const { stream, error } = await getUserMediaStream();
      if (stream) {
        setPreviewStream(stream);
        setIsPreviewActive(true);
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
        }
      }
    }
  };

  useEffect(() => {
    if (previewVideoRef.current && previewStream) {
      previewVideoRef.current.srcObject = previewStream;
    }
  }, [previewStream, isPreviewActive]);

  // Clean preview when unmounting or starting call
  useEffect(() => {
    if (callStatus !== 'idle' && previewStream) {
      previewStream.getTracks().forEach((track) => track.stop());
      setPreviewStream(null);
      setIsPreviewActive(false);
    }
  }, [callStatus]);

  const handleStartCall = (emailToCall) => {
    const finalEmail = emailToCall || targetEmail;
    if (!finalEmail) {
      setCallError('Iltimos, bog‘lanish uchun 2-tomon emailini kiriting.');
      return;
    }
    // Stop local preview before real call
    if (previewStream) {
      previewStream.getTracks().forEach((track) => track.stop());
      setPreviewStream(null);
      setIsPreviewActive(false);
    }
    startCall(finalEmail);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Error Banner */}
      {callError && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{callError}</span>
          </div>
          <button
            onClick={() => setCallError(null)}
            className="text-xs text-rose-400 hover:text-rose-200 underline"
          >
            Yopish
          </button>
        </div>
      )}

      {/* Outgoing Calling Overlay */}
      {callStatus === 'calling' && (
        <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-indigo-950/80 to-slate-900/90 border border-indigo-500/30 text-center relative overflow-hidden shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center mb-3 animate-ping" />
          <h3 className="text-xl font-bold text-white -mt-12">
            Qo‘ng‘iroq qilinmoqda...
          </h3>
          <p className="text-sm text-indigo-300 font-mono mt-1">
            {currentCall?.receiverEmail}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Foydalanuvchining javobi kutilmoqda. Google STUN orqali P2P ulanish o‘rnatilmoqda...
          </p>
          <div className="mt-5">
            <button
              onClick={endCall}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Qo‘ng‘iroqni bekor qilish</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Direct Call by Email */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Call Action Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-white">2-tomon bilan bog‘lanish</h2>
              </div>
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                To‘g‘ridan-to‘g‘ri P2P
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-5">
              Qo‘ng‘iroq qilmoqchi bo‘lgan foydalanuvchining email manzilini kiriting va darhol video muloqotni boshlang.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleStartCall();
              }}
              className="space-y-4"
            >
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="2-tomonning email manzili (masalan: sherik@gmail.com)"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-inner"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="submit"
                  disabled={callStatus !== 'idle'}
                  className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2.5 transition-all disabled:opacity-50"
                >
                  <Video className="w-5 h-5" />
                  <span>Video qo‘ng‘iroq qilish</span>
                </button>

                <button
                  type="button"
                  onClick={togglePreview}
                  className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  {isPreviewActive ? (
                    <>
                      <CameraOff className="w-4 h-4 text-rose-400" />
                      <span>Kamerani yopish</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 text-indigo-400" />
                      <span>Kamerani tekshirish</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Camera Preview Video */}
            {isPreviewActive && (
              <div className="mt-6 p-4 rounded-2xl bg-slate-950 border border-slate-800 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Kamera testi (Oldindan ko‘rish)
                  </span>
                  <span className="text-[11px]">Faqat sizga ko‘rinadi</span>
                </div>
                <div className="relative rounded-xl overflow-hidden aspect-video bg-black max-w-md mx-auto">
                  <video
                    ref={previewVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Registered Users Quick Call */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Ro‘yxatdan o‘tgan foydalanuvchilar</h3>
              </div>
              <span className="text-xs text-slate-400">
                {usersList.length} ta foydalanuvchi
              </span>
            </div>

            {usersList.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                Hozircha boshqa foydalanuvchilar mavjud emas. Boshqa brauzerda yoki inkognito oynada yangi akkaunt ochib sinab ko‘ring!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {usersList.map((u) => (
                  <div
                    key={u.id}
                    className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-indigo-500/40 flex items-center justify-between gap-3 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-800 to-indigo-900/60 border border-slate-700/60 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-indigo-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-white truncate">
                            {u.displayName || u.email.split('@')[0]}
                          </p>
                          {u.online ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Online" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0" title="Offline" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setTargetEmail(u.email);
                        handleStartCall(u.email);
                      }}
                      disabled={callStatus !== 'idle'}
                      title="Qo‘ng‘iroq qilish"
                      className="p-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 transition-all shrink-0"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Google STUN & Info */}
        <div className="space-y-6">
          
          {/* Google STUN Architecture Card */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Google STUN Xizmati</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ushbu ilova Google tomonidan taqdim etilgan ochiq (public) STUN serverlaridan foydalanadi:
            </p>
            <div className="mt-3 space-y-1.5 font-mono text-[11px] text-indigo-300 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>stun.l.google.com:19302</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>stun1.l.google.com:19302</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>stun2.l.google.com:19302</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-2">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>Video va audio to‘g‘ridan-to‘g‘ri brauzerdan brauzerga (Peer-to-Peer) uzatiladi.</span>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>Firebase faqat ulanish ma’lumotlarini (SDP Offer/Answer va ICE nomzodlarini) almashish uchun ishlatiladi.</span>
              </div>
            </div>
          </div>

          {/* Quick instructions */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/40 to-slate-900/80 border border-indigo-500/20 shadow-xl">
            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">
              Qanday ishlatiladi?
            </h4>
            <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside">
              <li>Ushbu oynani birinchi foydalanuvchi sifatida oching.</li>
              <li>Boshqa brauzerda (yoki Incognito rejimida) ikkinchi akkaunt bilan kiring.</li>
              <li>Birinchi foydalanuvchidan ikkinchisining emailini kiritib, "Video qo‘ng‘iroq qilish" tugmasini bosing.</li>
              <li>Ikkinchi tomonda "Qabul qilish" oynasi paydo bo‘ladi va P2P video chat ulanadi!</li>
            </ol>
          </div>

        </div>

      </div>
    </div>
  );
};
