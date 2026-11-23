# WebRTC P2P Video Chat (Vite + React + Firebase + Google STUN)

Google ning rasmiy public STUN serverlaridan foydalangan holda qurilgan zamonaviy Peer-to-Peer (P2P) video chat veb-ilovasi.

## 🚀 Texnologiyalar
- **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons
- **Autentifikatsiya va Signallash:** Firebase Auth, Cloud Firestore
- **WebRTC STUN:** Google Public STUN (`stun:stun.l.google.com:19302`)
- **P2P DataChannel:** Shaxsiy matnli chat xabarlarini to'g'ridan-to'g'ri brauzerdan brauzerga uzatish

## ⚙️ Sozlamalar va Ishga tushirish

1. **Atrof-muhit o'zgaruvchilari (`.env.local`):**
   Firebase kalitlari `.env.local` faylida saqlanadi:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=asqarjon-30b89.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://asqarjon-30b89-default-rtdb.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=asqarjon-30b89
   VITE_FIREBASE_STORAGE_BUCKET=asqarjon-30b89.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=486115528515
   VITE_FIREBASE_APP_ID=1:486115528515:web:40b5eefc4054b995fe69f6
   VITE_FIREBASE_MEASUREMENT_ID=G-RZYT6311LF
   ```

2. **Serverni ishga tushirish:**
   ```bash
   npm run dev
   ```

3. **Sinab ko'rish:**
   - 1-brauzer oynasida bitta email bilan ro'yxatdan o'ting yoki kiring.
   - 2-brauzer (yoki Incognito) oynasida boshqa email bilan kiring.
   - 1-tomondan 2-tomonning emailini kiriting va **"Video qo'ng'iroq qilish"** tugmasini bosing.
   - 2-tomonda kiruvchi qo'ng'iroq oynasi jiringlaydi, **"Qabul qilish"** tugmasini bosing va to'g'ridan-to'g'ri P2P video suhbat boshlanadi.
