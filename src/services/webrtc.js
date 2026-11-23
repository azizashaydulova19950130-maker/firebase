// Google Public STUN Servers configuration
export const ICE_SERVERS = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302',
      ],
    },
  ],
  iceCandidatePoolSize: 10,
};

// Create a new RTCPeerConnection configured with Google STUN
export const createPeerConnection = () => {
  return new RTCPeerConnection(ICE_SERVERS);
};

// Get User Local Audio and Video Media Stream
export const getUserMediaStream = async (constraints = { video: true, audio: true }) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return { stream, error: null };
  } catch (err) {
    console.error("Kamera yoki mikrofonga ulanishda xatolik:", err);
    return { stream: null, error: err.message };
  }
};

// Get Screen Share Media Stream
export const getDisplayMediaStream = async () => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always' },
      audio: false,
    });
    return { stream, error: null };
  } catch (err) {
    console.error("Ekranni ulashishda xatolik:", err);
    return { stream: null, error: err.message };
  }
};
