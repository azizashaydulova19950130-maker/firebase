import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import {
  createPeerConnection,
  getUserMediaStream,
  getDisplayMediaStream,
} from '../services/webrtc';
import { sounds } from '../services/soundEffects';

const CallContext = createContext(null);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

export const CallProvider = ({ children }) => {
  const { user } = useAuth();

  // Call status: 'idle' | 'calling' | 'incoming' | 'connected'
  const [callStatus, setCallStatus] = useState('idle');
  const [currentCall, setCurrentCall] = useState(null);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [callError, setCallError] = useState(null);

  // Streams
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // Controls state
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState('Yaxshi');

  // Chat in call
  const [messages, setMessages] = useState([]);
  const [callDuration, setCallDuration] = useState(0);

  // Refs for WebRTC resources
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const screenTrackRef = useRef(null);
  const dataChannelRef = useRef(null);
  const unsubscribeCallRef = useRef(null);
  const unsubscribeCandidatesRef = useRef(null);
  const timerRef = useRef(null);

  // Synchronize stream states to refs
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    remoteStreamRef.current = remoteStream;
  }, [remoteStream]);

  // Call duration counter
  useEffect(() => {
    if (callStatus === 'connected') {
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setCallDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  // Listen for incoming calls for current user
  useEffect(() => {
    if (!user || !user.email) return;

    const myEmail = user.email.toLowerCase();
    const callsRef = collection(db, 'calls');
    const q = query(
      callsRef,
      where('receiverEmail', '==', myEmail),
      where('status', '==', 'calling')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // If we are already busy on a call, ignore or we can decline
        if (callStatus !== 'idle') return;

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = { id: change.doc.id, ...change.doc.data() };
            // Ensure this call was created within the last 45 seconds to avoid stale calls
            setIncomingCallData(data);
            setCallStatus('incoming');
            sounds.playIncomingRingtone();
          }
        });
      },
      (error) => {
        console.warn('Kiruvchi qo‘ng‘iroqlarni tinglashda ogohlantirish:', error.message);
      }
    );

    return () => unsubscribe();
  }, [user, callStatus]);

  // Setup DataChannel for in-call P2P chat
  const setupDataChannel = (dc) => {
    dataChannelRef.current = dc;
    dc.onopen = () => console.log('P2P DataChannel ochildi');
    dc.onclose = () => console.log('P2P DataChannel yopildi');
    dc.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        setMessages((prev) => [...prev, msg]);
      } catch (e) {
        console.error('DataChannel xabari parse qilinmadi:', e);
      }
    };
  };

  const sendChatMessage = (text) => {
    if (!text.trim()) return;
    const msg = {
      id: Date.now().toString(),
      senderEmail: user.email,
      senderName: user.displayName || user.email.split('@')[0],
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      dataChannelRef.current.send(JSON.stringify(msg));
    }
    setMessages((prev) => [...prev, { ...msg, isMe: true }]);
  };

  // Cleanup all WebRTC resources and media
  const cleanupCall = () => {
    sounds.stopAll();

    if (unsubscribeCallRef.current) {
      unsubscribeCallRef.current();
      unsubscribeCallRef.current = null;
    }
    if (unsubscribeCandidatesRef.current) {
      unsubscribeCandidatesRef.current();
      unsubscribeCandidatesRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    setRemoteStream(null);
    setCallStatus('idle');
    setCurrentCall(null);
    setIncomingCallData(null);
    setIsMicMuted(false);
    setIsVideoMuted(false);
    setIsScreenSharing(false);
    setMessages([]);
  };

  // 1. OUTGOING CALL (Caller)
  const startCall = async (targetEmail) => {
    setCallError(null);
    const cleanTargetEmail = targetEmail.trim().toLowerCase();

    if (!cleanTargetEmail) {
      setCallError('Iltimos, bog‘lanish uchun email manzilini kiriting.');
      return;
    }

    if (cleanTargetEmail === user.email.toLowerCase()) {
      setCallError('O‘zingizning emailingizga qo‘ng‘iroq qila olmaysiz.');
      return;
    }

    try {
      setCallStatus('calling');
      sounds.playOutgoingDialtone();

      // Get user local camera & microphone
      const { stream, error } = await getUserMediaStream();
      if (error || !stream) {
        sounds.stopAll();
        setCallStatus('idle');
        setCallError(`Kamera yoki mikrofonga ulanib bo‘lmadi: ${error || 'Ruxsat berilmadi'}`);
        return;
      }

      setLocalStream(stream);

      // Create Peer Connection with Google STUN
      const pc = createPeerConnection();
      pcRef.current = pc;

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Prepare remote stream
      const remote = new MediaStream();
      setRemoteStream(remote);
      remoteStreamRef.current = remote;

      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remote.addTrack(track);
        });
      };

      // Create DataChannel for P2P messaging
      const dc = pc.createDataChannel('chat');
      setupDataChannel(dc);

      // Create Firestore call document
      const callDocRef = doc(collection(db, 'calls'));
      const callerCandidatesCol = collection(callDocRef, 'callerCandidates');
      const calleeCandidatesCol = collection(callDocRef, 'calleeCandidates');

      setCurrentCall({ id: callDocRef.id, receiverEmail: cleanTargetEmail });

      // Send local ICE candidates to Firestore
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(callerCandidatesCol, event.candidate.toJSON()).catch((err) =>
            console.error('Caller ICE yozishda xato:', err)
          );
        }
      };

      // Connection state change listener
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setConnectionQuality('Zo‘r (Google STUN P2P)');
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setConnectionQuality('Aloqa uzildi');
        }
      };

      // Create offer
      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);

      const callData = {
        id: callDocRef.id,
        callerEmail: user.email.toLowerCase(),
        callerName: user.displayName || user.email.split('@')[0],
        receiverEmail: cleanTargetEmail,
        status: 'calling',
        offer: {
          type: offerDescription.type,
          sdp: offerDescription.sdp,
        },
        createdAt: serverTimestamp(),
      };

      await setDoc(callDocRef, callData);

      // Listen for remote answer
      unsubscribeCallRef.current = onSnapshot(callDocRef, async (snapshot) => {
        const data = snapshot.data();
        if (!data) return;

        if (data.status === 'connected' && data.answer && !pc.currentRemoteDescription) {
          sounds.stopAll();
          sounds.playConnectedSound();
          const answerDescription = new RTCSessionDescription(data.answer);
          await pc.setRemoteDescription(answerDescription);
          setCallStatus('connected');
        } else if (data.status === 'rejected') {
          sounds.stopAll();
          sounds.playEndSound();
          setCallError('Qo‘ng‘iroq rad etildi.');
          cleanupCall();
        } else if (data.status === 'ended') {
          sounds.stopAll();
          sounds.playEndSound();
          setCallError('Suhbat yakunlandi.');
          cleanupCall();
        }
      });

      // Listen for callee's ICE candidates
      unsubscribeCandidatesRef.current = onSnapshot(calleeCandidatesCol, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.addIceCandidate(candidate).catch((err) =>
              console.error('Callee ICE qo‘shishda xato:', err)
            );
          }
        });
      });
    } catch (err) {
      console.error('Qo‘ng‘iroq boshlashda xatolik:', err);
      sounds.stopAll();
      setCallStatus('idle');
      setCallError(err.message || 'Qo‘ng‘iroq boshlashda kutilmagan xatolik.');
      cleanupCall();
    }
  };

  // 2. INCOMING CALL (Callee Accept)
  const acceptIncomingCall = async () => {
    if (!incomingCallData) return;

    sounds.stopAll();
    setCallError(null);
    const callDocRef = doc(db, 'calls', incomingCallData.id);

    try {
      // Get user local stream
      const { stream, error } = await getUserMediaStream();
      if (error || !stream) {
        setCallError(`Kamera yoki mikrofonga ulanib bo‘lmadi: ${error || 'Ruxsat berilmadi'}`);
        await updateDoc(callDocRef, { status: 'rejected' });
        cleanupCall();
        return;
      }

      setLocalStream(stream);

      // Create Peer Connection with Google STUN
      const pc = createPeerConnection();
      pcRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Prepare remote stream
      const remote = new MediaStream();
      setRemoteStream(remote);
      remoteStreamRef.current = remote;

      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          remote.addTrack(track);
        });
      };

      // Listen for DataChannel from caller
      pc.ondatachannel = (event) => {
        setupDataChannel(event.channel);
      };

      const callerCandidatesCol = collection(callDocRef, 'callerCandidates');
      const calleeCandidatesCol = collection(callDocRef, 'calleeCandidates');

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(calleeCandidatesCol, event.candidate.toJSON()).catch((err) =>
            console.error('Callee ICE yozishda xato:', err)
          );
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setConnectionQuality('Zo‘r (Google STUN P2P)');
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setConnectionQuality('Aloqa uzildi');
        }
      };

      // Set Remote Description (Offer)
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCallData.offer));

      // Create Answer
      const answerDescription = await pc.createAnswer();
      await pc.setLocalDescription(answerDescription);

      await updateDoc(callDocRef, {
        answer: {
          type: answerDescription.type,
          sdp: answerDescription.sdp,
        },
        status: 'connected',
      });

      setCurrentCall({
        id: incomingCallData.id,
        callerEmail: incomingCallData.callerEmail,
        callerName: incomingCallData.callerName,
      });
      setCallStatus('connected');
      sounds.playConnectedSound();

      // Listen for caller's ICE candidates
      unsubscribeCandidatesRef.current = onSnapshot(callerCandidatesCol, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            pc.addIceCandidate(candidate).catch((err) =>
              console.error('Caller ICE qo‘shishda xato:', err)
            );
          }
        });
      });

      // Listen for call termination
      unsubscribeCallRef.current = onSnapshot(callDocRef, (snapshot) => {
        const data = snapshot.data();
        if (data && data.status === 'ended') {
          sounds.playEndSound();
          cleanupCall();
        }
      });
    } catch (err) {
      console.error('Qo‘ng‘iroqni qabul qilishda xatolik:', err);
      sounds.stopAll();
      setCallError('Qo‘ng‘iroqni qabul qilib bo‘lmadi.');
      cleanupCall();
    }
  };

  // Reject Incoming Call
  const rejectIncomingCall = async () => {
    sounds.stopAll();
    if (incomingCallData) {
      try {
        const callDocRef = doc(db, 'calls', incomingCallData.id);
        await updateDoc(callDocRef, { status: 'rejected' });
      } catch (err) {
        console.warn('Reject xatolik:', err.message);
      }
    }
    cleanupCall();
  };

  // End active call
  const endCall = async () => {
    sounds.stopAll();
    sounds.playEndSound();
    const activeId = currentCall?.id || incomingCallData?.id;
    if (activeId) {
      try {
        const callDocRef = doc(db, 'calls', activeId);
        await updateDoc(callDocRef, { status: 'ended' });
      } catch (err) {
        console.warn('End call update xatosi:', err.message);
      }
    }
    cleanupCall();
  };

  // Toggle Microphone
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Video Camera
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  // Toggle Screen Share
  const toggleScreenShare = async () => {
    if (!pcRef.current) return;

    if (!isScreenSharing) {
      const { stream, error } = await getDisplayMediaStream();
      if (error || !stream) return;

      const screenTrack = stream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;

      // Replace video track in peer connection
      const sender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (sender) {
        sender.replaceTrack(screenTrack);
      }

      // Handle user stopping screen share via browser floating bar
      screenTrack.onended = () => {
        stopScreenShare();
      };

      setIsScreenSharing(true);
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    if (localStreamRef.current && pcRef.current) {
      const originalVideoTrack = localStreamRef.current.getVideoTracks()[0];
      const sender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (sender && originalVideoTrack) {
        sender.replaceTrack(originalVideoTrack);
      }
    }

    setIsScreenSharing(false);
  };

  const value = {
    callStatus,
    currentCall,
    incomingCallData,
    callError,
    setCallError,
    localStream,
    remoteStream,
    isMicMuted,
    isVideoMuted,
    isScreenSharing,
    connectionQuality,
    callDuration,
    messages,
    sendChatMessage,
    startCall,
    acceptIncomingCall,
    rejectIncomingCall,
    endCall,
    toggleMic,
    toggleVideo,
    toggleScreenShare,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
