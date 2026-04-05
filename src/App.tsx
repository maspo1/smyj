/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import {
  Heart,
  Calendar as CalendarIcon,
  MapPin,
  Copy,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  MessageSquare,
  Music,
  Clock,
  Volume2,
  VolumeX,
  Phone,
  Navigation,
  Camera,
  Train,
  Bus,
  Car,
} from 'lucide-react';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { db, storage } from './firebase';

// --- Types ---
interface BankAccount {
  owner: string;
  bank: string;
  number: string;
  bankCode: string;   // for Toss deeplink
  ownerName: string;  // for Toss deeplink
}

interface GuestMessage {
  id?: string;
  name: string;
  message: string;
  date: string;
}

interface GuestPhoto {
  id?: string;
  url: string;
  uploaderName: string;
}

// --- Constants ---
const WEDDING_DATE       = new Date('2026-06-27T12:00:00');
const PHOTO_UPLOAD_OPEN  = new Date('2026-06-27T00:00:00');
const PHOTO_UPLOAD_CLOSE = new Date('2026-07-04T23:59:59');
const MAX_FILE_SIZE      = 5 * 1024 * 1024; // 5 MB

/**
 * 테스트 모드: true → 날짜 제한 없이 업로드 가능
 * 실제 서비스 시: false 로 변경
 */
const PHOTO_UPLOAD_TESTING = true;

// TODO: 실제 전화번호로 교체하세요
const GROOM_PHONE = '010-5500-2703';
const BRIDE_PHONE = '010-6250-0450';

const GROOM_ACCOUNTS: BankAccount[] = [
  { owner: '국민은행 한성민',  bank: '신랑',      number: '83140201094905', bankCode: '국민', ownerName: '한성민' },
  { owner: '국민은행 한욱',  bank: '신랑 아버지', number: '83140201094905', bankCode: '국민', ownerName: '한욱' },
  { owner: '국민은행 양현정',  bank: '신랑 어머니', number: '74090102146705', bankCode: '국민', ownerName: '양현정' },
];
const BRIDE_ACCOUNTS: BankAccount[] = [
  { owner: '카카오뱅크 추연정',  bank: '신부',      number: '3333101220795', bankCode: '카카오뱅크', ownerName: '추연정' },
  { owner: '기업은행 추성운',  bank: '신부 아버지', number: '74090102146705', bankCode: '기업은행', ownerName: '추성운' },
  { owner: '기업은행 이병선',  bank: '신부 어머니', number: '74090102146705', bankCode: '기업은행', ownerName: '이병선' },
];

// Gallery: album 폴더 이미지를 자동으로 불러옴 (6장씩 페이지 분할)
const _albumGlob = import.meta.glob<string>(
  '/src/components/images/album/*.{jpg,jpeg,JPG,JPEG,png,PNG}',
  { eager: true, query: '?url', import: 'default' }
);
const ALBUM_PHOTOS: string[] = Object.values(_albumGlob);

// 6장 단위로 페이지 분할
const GALLERY_PAGES: string[][] = [];
for (let i = 0; i < ALBUM_PHOTOS.length; i += 6) {
  GALLERY_PAGES.push(ALBUM_PHOTOS.slice(i, i + 6));
}

// --- Helpers ---
const openToss = (bankCode: string, accountNo: string, ownerName: string) => {
  const params = `bank=${encodeURIComponent(bankCode)}&accountNo=${accountNo}&recipient=${encodeURIComponent(ownerName)}&amount=0`;
  const timeout = setTimeout(() => {
    alert('토스 앱이 설치되어 있지 않습니다.\n계좌번호를 복사하여 이체해 주세요.');
  }, 2000);
  window.addEventListener('pagehide', () => clearTimeout(timeout), { once: true });
  window.location.href = `supertoss://send?${params}`;
};

const openNaverMap = () => {
  const q = encodeURIComponent('더 시그너스 웨딩홀 대전');
  window.open(`https://map.naver.com/v5/search/${q}`, '_blank', 'noopener,noreferrer');
};

const openKakaoMap = () => {
  const q = encodeURIComponent('더 시그너스 웨딩홀 대전');
  window.open(`https://map.kakao.com/link/search/${q}`, '_blank', 'noopener,noreferrer');
};

// --- Sub-components ---

const RevealSection: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y       = useTransform(scrollYProgress, [0, 0.2], [50, 0]);
  return (
    <motion.section ref={ref} style={{ opacity, y }} className={`py-24 px-6 ${className}`}>
      {children}
    </motion.section>
  );
};

const ParallaxImage: React.FC<{ src: string; alt: string; className?: string }> = ({
  src,
  alt,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y     = useTransform(scrollYProgress, [0, 1], ['-10%', '10%']);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1, 1.1]);
  return (
    <motion.div
      ref={ref}
      initial={{ scale: 0.9, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className={`overflow-hidden relative ${className}`}
    >
      <motion.img
        src={src}
        alt={alt}
        style={{ y, scale }}
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
    </motion.div>
  );
};

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const dist = WEDDING_DATE.getTime() - Date.now();
      if (dist < 0) return;
      setTimeLeft({
        days:    Math.floor(dist / 86_400_000),
        hours:   Math.floor((dist % 86_400_000) / 3_600_000),
        minutes: Math.floor((dist % 3_600_000)  / 60_000),
        seconds: Math.floor((dist % 60_000)      / 1_000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex justify-center gap-6 mt-12">
      {[
        { label: 'DAYS', value: timeLeft.days },
        { label: 'HOUR', value: timeLeft.hours },
        { label: 'MIN',  value: timeLeft.minutes },
        { label: 'SEC',  value: timeLeft.seconds },
      ].map((item) => (
        <div key={item.label} className="flex flex-col items-center">
          <span className="text-3xl font-light tracking-tighter text-blush">{item.value}</span>
          <span className="text-[9px] tracking-[0.2em] text-gray-400 mt-1">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

const Calendar = () => {
  const days     = Array.from({ length: 30 }, (_, i) => i + 1);
  const startDay = 1;
  return (
    <div className="mt-12 max-w-xs mx-auto">
      <div className="calendar-grid text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={`${d}-${i}`} className="text-[10px] text-gray-400 mb-3 tracking-widest">{d}</div>
        ))}
        {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} />)}
        {days.map((d) =>
          d === 27 ? (
            /* 27일: 하트 위에 날짜 숫자도 함께 표시 */
            <div key={d} className="calendar-day scale-125 transition-all duration-500 relative flex items-center justify-center">
              <Heart
                size={22}
                className="text-blush drop-shadow-sm absolute"
                style={{ fill: '#e8b4b8', strokeWidth: 0 }}
              />
              <span className="relative z-10 text-[9px] font-bold" style={{ color: '#fff' }}>27</span>
            </div>
          ) : (
            <div key={d} className="calendar-day transition-all duration-500 opacity-60">
              {d}
            </div>
          )
        )}
      </div>
    </div>
  );
};

// --- Lightbox ---
interface LightboxProps {
  photos: string[];
  index: number;
  onClose: () => void;
  onJump: (i: number) => void;
}

const Lightbox: React.FC<LightboxProps> = ({ photos, index, onClose, onJump }) => {
  const prev = () => { if (index > 0) onJump(index - 1); };
  const next = () => { if (index < photos.length - 1) onJump(index + 1); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index]);   // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[999] bg-black/95 flex flex-col"
      onClick={onClose}
    >
      {/* 상단 바: 카운터 + 닫기 */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
        <span className="text-white/50 text-sm tracking-widest font-light">
          {index + 1} <span className="text-white/25">/</span> {photos.length}
        </span>
        <button
          onClick={onClose}
          className="p-2 text-white/50 hover:text-white transition-colors active:scale-90"
        >
          <X size={22} strokeWidth={1.5} />
        </button>
      </div>

      {/* 이미지 영역 */}
      <div className="flex-1 flex items-center justify-center relative px-12 min-h-0">
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          disabled={index === 0}
          className="absolute left-1 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white disabled:opacity-20 transition-all active:scale-90"
        >
          <ChevronLeft size={28} strokeWidth={1.5} />
        </button>

        <AnimatePresence mode="wait">
          <motion.img
            key={index}
            src={photos[index]}
            alt={`Photo ${index + 1} / ${photos.length}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="max-w-full max-h-full object-contain rounded-sm select-none"
            style={{ maxHeight: 'calc(100vh - 160px)' }}
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </AnimatePresence>

        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          disabled={index === photos.length - 1}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white disabled:opacity-20 transition-all active:scale-90"
        >
          <ChevronRight size={28} strokeWidth={1.5} />
        </button>
      </div>

      {/* 하단 썸네일 스트립 */}
      <div
        className="flex-shrink-0 overflow-x-auto py-3 px-4"
        style={{ scrollbarWidth: 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-1.5 w-max mx-auto">
          {photos.map((src, i) => (
            <button
              key={i}
              onClick={() => onJump(i)}
              className={`w-12 h-12 flex-shrink-0 overflow-hidden rounded transition-all ${
                i === index
                  ? 'ring-2 ring-white/80 opacity-100 scale-105'
                  : 'opacity-40 hover:opacity-70'
              }`}
            >
              <img src={src} className="w-full h-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Toss logo mark
const TossIcon: React.FC = () => (
  <div className="w-15 h-10 rounded-xl bg-white shadow-md border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
    <img
      src="/src/components/images/tosslogo.png"
      alt="토스로 송금"
      className="w-15 h-9 object-contain"
      draggable={false}
    />
  </div>
);

const Accordion = ({ title, accounts }: { title: string; accounts: BankAccount[] }) => {
  const [isOpen, setIsOpen] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('계좌번호가 복사되었습니다.');
  };

  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex justify-between items-center text-left group"
      >
        <span className="font-light tracking-tight text-gray-700 group-hover:text-blush transition-colors">
          {title}
        </span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
          <ChevronDown size={18} className="text-gray-300" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pb-6 space-y-4">
              {accounts.map((acc, idx) => (
                <div
                  key={idx}
                  className="bg-ivory/50 p-4 rounded-xl border border-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-[10px] text-gray-400 tracking-widest uppercase mb-1">{acc.bank}</div>
                      <div className="text-sm font-medium tracking-tight">{acc.number}</div>
                      <div className="text-xs text-gray-500 mt-1">{acc.owner}</div>
                    </div>
                    <div className="flex flex-col gap-2 items-center">
                      {/* Toss */}
                      <button
                        onClick={() => openToss(acc.bankCode, acc.number, acc.ownerName)}
                        className="p-2 hover:scale-110 rounded-lg transition-all active:scale-95"
                        title="토스로 송금"
                      >
                        <TossIcon />
                      </button>
                      {/* Copy */}
                      <button
                        onClick={() => copyToClipboard(acc.number)}
                        className="p-2.5 text-blush hover:bg-white rounded-full transition-all shadow-sm active:scale-95"
                        title="계좌번호 복사"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Infinite horizontal ticker for guestbook messages
const GuestbookTicker: React.FC<{ messages: GuestMessage[] }> = ({ messages }) => {
  if (messages.length === 0) {
    return (
      <p className="text-center text-sm text-gray-400 font-light py-8">
        아직 방명록이 없습니다. 첫 번째 메시지를 남겨주세요!
      </p>
    );
  }

  // 4 copies for always-full ticker
  const items = [...messages, ...messages, ...messages, ...messages];
  const duration = Math.max(20, messages.length * 6);

  return (
    <div className="overflow-hidden -mx-6 py-4">
      <div className="marquee-ticker gap-4 px-4" style={{ animationDuration: `${duration}s` }}>
        {items.map((msg, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 w-56 bg-white p-5 rounded-2xl shadow-sm border border-gray-50"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-sm tracking-tight">{msg.name}</span>
              <span className="text-[9px] text-gray-300 tracking-widest">{msg.date}</span>
            </div>
            <p className="text-xs text-gray-500 font-light leading-relaxed line-clamp-3">
              {msg.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main App ---
export default function App() {
  // Guestbook state
  // Firebase 연결 시 빈 배열로 시작 (스냅샷으로 채움), 미연결 시 샘플 데이터
  const [messages, setMessages] = useState<GuestMessage[]>(() =>
    db
      ? []
      : [
          { name: '민수', message: '결혼 너무 축하드려요! 행복하게 잘 사세요!', date: '2026.02.28' },
          { name: '지혜', message: '드디어 가는구나! 꽃길만 걷자 친구야!',     date: '2026.02.28' },
        ]
  );
  const [newName,    setNewName]    = useState('');
  const [newMessage, setNewMessage] = useState('');

  // Guest photo state
  const [guestPhotos,       setGuestPhotos]       = useState<GuestPhoto[]>([]);
  const [uploadProgress,    setUploadProgress]    = useState(0);
  const [photoUploaderName, setPhotoUploaderName] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Audio state
  const audioRef  = useRef<HTMLAudioElement>(null);
  const [isMuted,     setIsMuted]     = useState(false);
  const [hasStarted,  setHasStarted]  = useState(false);

  // Gallery swipe state
  const galleryRef       = useRef<HTMLDivElement>(null);
  // 스와이프 vs 탭 구분용 refs (onClick이 스크롤 컨테이너에서 모바일에서 안 터짐)
  const galleryTouchX0   = useRef(0);
  const galleryTouchY0   = useRef(0);
  const galleryDragging  = useRef(false);
  const [galleryPage,    setGalleryPage]    = useState(0);
  const [lightboxIndex,  setLightboxIndex]  = useState<number | null>(null);

  // --- Effects ---

  // Play audio on first scroll
  useEffect(() => {
    const handleFirstScroll = () => {
      if (hasStarted || !audioRef.current) return;
      audioRef.current.volume = 0;
      audioRef.current.play().catch(() => {});
      setHasStarted(true);
      let vol = 0;
      const id = setInterval(() => {
        vol = Math.min(vol + 0.05, 1);
        if (audioRef.current) audioRef.current.volume = vol;
        if (vol >= 1) clearInterval(id);
      }, 100);
      window.removeEventListener('scroll', handleFirstScroll);
    };
    window.addEventListener('scroll', handleFirstScroll);
    return () => window.removeEventListener('scroll', handleFirstScroll);
  }, [hasStarted]);

  // Sync guestbook from Firestore
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'guestbook'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap: { docs: { id: string; data: () => DocumentData }[] }) => {
      setMessages(
        snap.docs.map((doc) => {
          const data = doc.data() as DocumentData;
          // Firestore Timestamp → 한국어 날짜 문자열
          const ts = data.createdAt;
          const date =
            ts && typeof ts.toDate === 'function'
              ? (ts.toDate() as Date).toLocaleDateString('ko-KR')
              : (data.date as string) || '';
          return {
            id: doc.id,
            name: (data.name as string) || '',
            message: (data.message as string) || '',
            date,
          };
        })
      );
    }, (err: Error) => console.error('Firestore guestbook error:', err));
    return () => unsub();
  }, []);

  // Sync guest photos from Firestore
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'guestPhotos'), orderBy('uploadedAt', 'desc'));
    const unsub = onSnapshot(q, (snap: { docs: { id: string; data: () => DocumentData }[] }) => {
      setGuestPhotos(
        snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<GuestPhoto, 'id'>) }))
      );
    }, (err: Error) => console.error('Firestore photos error:', err));
    return () => unsub();
  }, []);

  // --- Handlers ---

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newMessage) return;

    const msg: GuestMessage = {
      name: newName,
      message: newMessage,
      date: new Date().toLocaleDateString('ko-KR'),
    };

    if (db) {
      try {
        await addDoc(collection(db, 'guestbook'), {
          name: msg.name,
          message: msg.message,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.error('Failed to save message:', err);
        setMessages((prev) => [msg, ...prev]);
      }
    } else {
      setMessages((prev) => [msg, ...prev]);
    }
    setNewName('');
    setNewMessage('');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const now = new Date();

    if (now < PHOTO_UPLOAD_OPEN) {
      alert('결혼식 당일(2026년 6월 27일)부터 업로드할 수 있습니다.');
      return;
    }
    if (now > PHOTO_UPLOAD_CLOSE) {
      alert('사진 업로드 기간이 종료되었습니다.\n(결혼식 후 일주일, ~2026. 07. 04까지)');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert(`파일 크기는 5MB 이하여야 합니다. (현재: ${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      e.target.value = '';
      return;
    }
    if (!storage || !db) {
      alert('사진 업로드를 사용하려면 Firebase를 설정해주세요.\nsrc/firebase.ts 가이드를 참고하세요.');
      return;
    }

    const fileRef = storageRef(storage, `guestPhotos/${Date.now()}_${file.name}`);
    const task    = uploadBytesResumable(fileRef, file);

    task.on(
      'state_changed',
      (snap: { bytesTransferred: number; totalBytes: number }) =>
        setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err: Error) => {
        console.error('Upload error:', err);
        setUploadProgress(0);
        alert('업로드 중 오류가 발생했습니다.');
      },
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          await addDoc(collection(db!, 'guestPhotos'), {
            url,
            uploaderName: photoUploaderName.trim() || '익명',
            uploadedAt:   serverTimestamp(),
          });
          setUploadProgress(0);
          setPhotoUploaderName('');
          if (photoInputRef.current) photoInputRef.current.value = '';
          alert('사진이 업로드되었습니다! 감사합니다 💕');
        } catch (err) {
          console.error('Firestore save error:', err);
          setUploadProgress(0);
        }
      }
    );
  };

  const handleGalleryScroll = () => {
    if (!galleryRef.current) return;
    const page = Math.round(galleryRef.current.scrollLeft / galleryRef.current.clientWidth);
    setGalleryPage(page);
  };

  // Photo upload window check
  const now                 = new Date();
  const uploadNotYet        = !PHOTO_UPLOAD_TESTING && now < PHOTO_UPLOAD_OPEN;
  const uploadExpired       = !PHOTO_UPLOAD_TESTING && now > PHOTO_UPLOAD_CLOSE;
  const uploadWindowActive  = !uploadNotYet && !uploadExpired;

  return (
    <div className="app-container relative">
      {/* Background audio */}
      <audio ref={audioRef} src="/src/components/music/thousand-years.mp3" loop />

      {/* Audio toggle */}
      <button
        onClick={toggleMute}
        className="fixed bottom-6 right-6 z-50 p-3 bg-white/80 backdrop-blur-md rounded-full shadow-xl border border-white/20 text-blush hover:scale-110 transition-transform active:scale-95"
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      {/* ─── 1. Hero ─── */}
      {/* 모든 레이어를 absolute로 독립 배치 — 서로 절대 밀리지 않음 */}
      <section className="relative h-screen overflow-hidden">

        {/* 배경 이미지 */}
        <div className="absolute inset-0 z-0">
          <img
            src="/src/components/images/q.jpg"
            alt="Wedding"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/70" />
        </div>

        {/* 텍스트 레이어 — 화면 정중앙 */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          >
            <p className="text-[10px] tracking-[0.5em] text-white/70 uppercase font-light">
              The Wedding of
            </p>
            <h1 className="text-5xl mt-6 font-serif italic text-white font-light tracking-tighter">
              Sungmin & Yeonjeong
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1.5 }}
            className="flex flex-col items-center mt-6 space-y-3"
          >
            <div className="h-px w-16 bg-white/30 mt-150" />
            <p className="text-xl font-serif text-white/90 font-light tracking-widest">
              2026. 06. 27. SAT. 12:00 PM
            </p>
            <p className="text-sm text-white/60 font-light tracking-tight">
              더 시그너스 웨딩홀 대전
            </p>
          </motion.div>
        </div>

        {/* 스크롤 유도 화살표 */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          className="absolute bottom-5 inset-x-0 z-20 flex justify-center text-white/40"
        >
          <ChevronDown size={20} strokeWidth={1} />
        </motion.div>
      </section>

      {/* ─── 2. Greeting ─── */}
      <RevealSection className="bg-white text-center">

        {/* can1.jpg — 섹션 가로 여백을 무시하고 풀너비로 표시 */}
        <div
          className="-mx-6 -mt-24 mb-12 overflow-hidden"
        >
          
          <motion.img
            src="/src/components/images/can5.jpg"
            alt="Wedding photo"
            className="w-full h-auto object-cover"
            initial={{ scale: 1.08 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            draggable={false}
          />
        </div>

        <Heart className="mx-auto text-blush mb-10" size={28} strokeWidth={1} />
        <div className="space-y-8">
          <p className="font-semibold text-lg tracking-[-0.1em]">
            "서로의 이름을 부르는 것만으로도<br />
            가슴 벅찬 설렘이 되는 사람을 만났습니다."
          </p>
          <div className="text-sm leading-loose text-gray-800 space-y-6 font-light">
            <p>
              곁에 있을 때 가장 나다운 모습이 되게 하는 한 사람,<br />
              꿈꾸던 미래를 함께 그려갈 수 있는 소중한 사람을 만나<br />
              이제 저희 두 사람, 사랑의 결실을 맺으려 합니다.
            </p>
            <p>
              저희의 새로운 시작을 축복해 주시면<br />
              더없는 기쁨으로 간직하겠습니다.
            </p>
          </div>

          {/* Parents & names – phone icons */}
          <div className="pt-12 flex justify-center">
            <div className="grid grid-cols-[auto_auto_auto] gap-x-4 gap-y-4 items-center">
              {/* 신랑 */}
              <span className="font-medium text-right text-lg tracking-tight">한　욱 · 양현정</span>
              <span className="font-light text-center text-sm text-gray-500">의 아들</span>
              <div className="flex items-center gap-1">
                <span className="font-bold text-lg tracking-tight">성민</span>
                <a
                  href={`tel:${GROOM_PHONE}`}
                  className="p-1 text-blush hover:bg-blush/10 rounded-full transition-colors"
                  title="신랑에게 전화"
                >
                  <Phone size={14} strokeWidth={1.5} />
                </a>
              </div>

              {/* 신부 */}
              <span className="font-medium text-right text-lg tracking-tight">추성운 · 이병선</span>
              <span className="font-light text-center text-sm text-gray-500">의 딸</span>
              <div className="flex items-center gap-1">
                <span className="font-bold text-lg tracking-tight">연정</span>
                <a
                  href={`tel:${BRIDE_PHONE}`}
                  className="p-1 text-blush hover:bg-blush/10 rounded-full transition-colors"
                  title="신부에게 전화"
                >
                  <Phone size={14} strokeWidth={1.5} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ─── 3. Countdown ─── */}
      <RevealSection className="bg-ivory/30">
        <div className="text-center">
          <CalendarIcon className="mx-auto text-sage mb-6" size={24} strokeWidth={1} />
          <h2 className="text-xl font-serif font-light tracking-tight">Save the Date</h2>
          <br />
          <h2 className="text-3xl font-serif font-light tracking-tight">6월</h2>
          <Calendar />
          <br />
          <div className="flex flex-col items-center space-y-3 py-10">
            <span className="text-[11px] text-blush tracking-[0.4em] uppercase font-light">
              In Perpetuum
            </span>
            <h2 className="font-sans text-xl tracking-[-0.08em] text-gray-800 antialiased">
              COUNT DOWN
            </h2>
            <div className="w-6 h-px bg-gray-200" />
          </div>
          <CountdownTimer />
        </div>
      </RevealSection>

      {/* ─── 4. Gallery — 3-col 바둑판 그리드, 좌우 스와이프 ─── */}
      {/*
       * RevealSection(overflow-hidden) 을 쓰면 내부 overflow-x-auto가 막힘
       * → 일반 section + whileInView 직접 사용
       */}
      <section className="py-20 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8 }}
        >
          {/* 타이틀 */}
          <div className="px-6 text-center mb-10">
            <h2 className="text-3xl font-serif font-light tracking-tight">Gallery</h2>
            <p className="text-[10px] text-gray-400 mt-3 tracking-[0.3em] uppercase font-light">
              Our Eternal Moments
            </p>
          </div>

          {/*
           * 스와이프 컨테이너
           * 핵심: flex:'0 0 100%' — 각 페이지가 컨테이너 가시 너비 정확히 100% 차지
           * minWidth:'100%' 는 스크롤 전체 너비 기준이라 스냅 오작동 발생
           */}
          <div
            ref={galleryRef}
            onScroll={handleGalleryScroll}
            /* 터치 시작 → 기준점 저장, 이동 감지, 탭이면 라이트박스 열기 */
            onTouchStart={(e) => {
              galleryTouchX0.current  = e.touches[0].clientX;
              galleryTouchY0.current  = e.touches[0].clientY;
              galleryDragging.current = false;
            }}
            onTouchMove={(e) => {
              const dx = Math.abs(e.touches[0].clientX - galleryTouchX0.current);
              const dy = Math.abs(e.touches[0].clientY - galleryTouchY0.current);
              if (dx > 12 || dy > 12) galleryDragging.current = true;
            }}
            style={{
              display: 'flex',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              width: '100%',
            }}
          >
            {GALLERY_PAGES.map((pagePhotos, pageIdx) => (
              <div
                key={pageIdx}
                style={{
                  flex: '0 0 100%',
                  scrollSnapAlign: 'start',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '2px',
                }}
              >
                {pagePhotos.map((src, i) => {
                  const globalIdx = pageIdx * 6 + i;
                  return (
                    <div
                      key={i}
                      onTouchStart={(e) => {
                        (e.currentTarget as HTMLDivElement).dataset.tx = String(e.touches[0].clientX);
                        (e.currentTarget as HTMLDivElement).dataset.ty = String(e.touches[0].clientY);
                      }}
                      onTouchEnd={(e) => {
                        const tx = parseFloat((e.currentTarget as HTMLDivElement).dataset.tx || '0');
                        const ty = parseFloat((e.currentTarget as HTMLDivElement).dataset.ty || '0');
                        const dx = Math.abs(e.changedTouches[0].clientX - tx);
                        const dy = Math.abs(e.changedTouches[0].clientY - ty);
                        if (dx < 12 && dy < 12) {
                          e.preventDefault();
                          setLightboxIndex(globalIdx);
                        }
                      }}
                      onClick={() => setLightboxIndex(globalIdx)}
                      style={{
                        position: 'relative',
                        width: '100%',
                        paddingBottom: '100%',
                        overflow: 'hidden',
                        backgroundColor: '#f3f4f6',
                        userSelect: 'none',
                        cursor: 'pointer',
                        touchAction: 'pan-x',
                      }}
                    >
                      <img
                        src={src}
                        alt={`Gallery ${globalIdx + 1}`}
                        style={{
                          position: 'absolute', top: 0, left: 0,
                          width: '100%', height: '100%',
                          objectFit: 'cover',
                          pointerEvents: 'none',
                        }}
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* 페이지 도트 인디케이터 */}
          <div className="flex justify-center gap-2 mt-4 px-6">
            {GALLERY_PAGES.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === galleryPage ? 'w-5 bg-blush' : 'w-1.5 bg-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-[10px] text-center text-gray-300 mt-3 tracking-[0.2em]">
            ← SWIPE →
          </p>
        </motion.div>
      </section>

      {/* ─── 5. Guest Snap Photos ─── */}
      <RevealSection className="bg-ivory/30">
        <div className="text-center mb-10">
          <Camera className="mx-auto text-blush mb-6" size={24} strokeWidth={1} />
          <h2 className="text-3xl font-serif font-light tracking-tight">Guest Photos</h2>
          <p className="text-[10px] text-gray-400 mt-3 tracking-[0.3em] uppercase font-light">
            결혼식 후 일주일간 스냅을 공유해주세요
          </p>
          <p className="text-sm text-blush/80 mt-4 font-light leading-relaxed">
            🎁 참여해 주신 게스트분들 중<br />
            선정된 분들께 소정의 기프티콘을 증정해드립니다
          </p>
        </div>

        {/* Upload form */}
        {uploadNotYet && (
          <div className="text-center py-8 space-y-2">
            <p className="text-sm text-gray-400 font-light">
              결혼식 당일(2026. 06. 27)부터 업로드할 수 있습니다.
            </p>
          </div>
        )}

        {uploadExpired && (
          <div className="text-center py-8 space-y-2">
            <p className="text-sm text-gray-400 font-light">
              사진 업로드 기간이 종료되었습니다.<br />
              함께해 주셔서 진심으로 감사합니다 💕
            </p>
          </div>
        )}

        {uploadWindowActive && (
          <div className="space-y-4 mb-10">
            <input
              type="text"
              placeholder="이름 (선택사항)"
              value={photoUploaderName}
              onChange={(e) => setPhotoUploaderName(e.target.value)}
              className="w-full p-4 rounded-xl border border-gray-100 bg-white text-sm focus:outline-none focus:border-blush/30 transition-all font-light"
            />
            <label className="block cursor-pointer">
              <div className="w-full py-6 border-2 border-dashed border-blush/30 rounded-2xl text-center hover:bg-blush/5 transition-colors">
                <Camera size={28} className="mx-auto text-blush/60 mb-2" strokeWidth={1} />
                <p className="text-sm text-gray-500 font-light">사진을 선택하세요</p>
                <p className="text-[10px] text-gray-300 mt-1 tracking-widest">
                  최대 5MB · JPG · PNG · HEIC
                </p>
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400 font-light">
                  <span>업로드 중...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blush rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Uploaded guest photos */}
        {guestPhotos.length > 0 && (
          <div>
            <p className="text-[10px] text-gray-400 mb-4 tracking-[0.3em] uppercase font-light text-center">
              업로드된 사진 {guestPhotos.length}장
            </p>
            <div className="grid grid-cols-3 gap-1">
              {guestPhotos.map((photo) => (
                <div key={photo.id} className="aspect-square overflow-hidden rounded-sm">
                  <img
                    src={photo.url}
                    alt={`${photo.uploaderName}의 사진`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </RevealSection>

      {/* ─── 6. Location ─── */}
      <RevealSection className="bg-white">
        <div className="text-center mb-12">
          <MapPin className="mx-auto text-blush mb-6" size={24} strokeWidth={1} />
          <h2 className="text-3xl font-serif font-light tracking-tight">Location</h2>
          <div className="mt-8 space-y-3">
            <p className="text-lg font-light tracking-tight">더 시그너스 웨딩홀 대전</p>
            <p className="text-sm text-gray-500 font-light">대전광역시 서구 탄방동 700</p>
            {/* Phone with icon */}
            <div className="flex items-center justify-center gap-2">
              <p className="text-sm text-gray-400 font-light tracking-widest">TEL. 042-481-1111</p>
              <a
                href="tel:042-481-1111"
                className="p-1 text-blush hover:bg-blush/10 rounded-full transition-colors"
                title="웨딩홀 전화"
              >
                <Phone size={14} strokeWidth={1.5} />
              </a>
            </div>
          </div>
        </div>

        {/* Map navigation buttons */}
        <div className="flex gap-3 justify-center mb-10">
          <button
            onClick={openNaverMap}
            className="flex items-center gap-2 px-5 py-3 bg-[#03C75A] text-white rounded-xl text-sm font-light tracking-tight shadow-lg shadow-green-500/20 hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <Navigation size={16} />
            네이버 지도
          </button>
          <button
            onClick={openKakaoMap}
            className="flex items-center gap-2 px-5 py-3 bg-[#FAE100] text-[#3C1E1E] rounded-xl text-sm font-light tracking-tight shadow-lg shadow-yellow-300/30 hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <Navigation size={16} />
            카카오 지도
          </button>
        </div>

        <ParallaxImage
          src="/src/components/images/maps.jpg"
          alt="Map"
          className="w-full aspect-video rounded-2xl shadow-lg"
        />

        <div className="mt-12 space-y-8">
          {/* 지하철 */}
          <div>
            <h4 className="text-xs font-bold text-sage mb-3 flex items-center gap-2 tracking-widest uppercase">
              <Train size={14} strokeWidth={1.5} className="text-sage" /> Subway
            </h4>
            <p className="text-sm text-gray-500 leading-relaxed font-light">
              1호선 탄방역 4번 출구 도보 <span className="font-medium text-gray-700">5분(300m)</span> 거리<br />
              1호선 시청역 8번 출구 도보 <span className="font-medium text-gray-700">6분(400m)</span> 거리<br />
            </p>
          </div>

          {/* 버스 */}
          <div>
            <h4 className="text-xs font-bold text-sage mb-3 flex items-center gap-2 tracking-widest uppercase">
              <Bus size={14} strokeWidth={1.5} className="text-sage" /> Bus
            </h4>
            <p className="text-sm text-gray-500 leading-relaxed font-light">
              샤크존 하차 : 104, 911<br />
              한우리아파트 하차 : 105, 706, 911<br />
              탄방역, 대전고용센터 하차 : 104, 105, 706<br />
            </p>
          </div>

          {/* 자차 */}
          <div>
            <h4 className="text-xs font-bold text-sage mb-3 flex items-center gap-2 tracking-widest uppercase">
              <Car size={14} strokeWidth={1.5} className="text-sage" /> Car (* 600대 주차 가능)
            </h4>
            <p className="text-sm text-gray-500 leading-relaxed font-light">
              수도권 방면 — 경부고속도로 <span className="font-medium text-gray-700">신탄진 IC</span> 이용<br />
              전라권 방면 — 호남고속도로 <span className="font-medium text-gray-700">유성 IC</span> 이용<br />
              경상권 방면 — 경부고속도로 <span className="font-medium text-gray-700">대전 IC</span> 이용
            </p>
          </div>
        </div>
      </RevealSection>

      {/* ─── 7. Account (Toss + Copy) ─── */}
      <RevealSection className="bg-ivory/30">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-serif font-light tracking-tight">Account</h2>
          <p className="text-[10px] text-gray-400 mt-3 tracking-[0.3em] uppercase font-light">
            Registry
          </p>
        </div>
        <div className="space-y-2">
          <Accordion title="신랑측" accounts={GROOM_ACCOUNTS} />
          <Accordion title="신부측" accounts={BRIDE_ACCOUNTS} />
        </div>
      </RevealSection>

      {/* ─── 8. Guestbook ─── */}
      <RevealSection className="bg-white">
        <div className="text-center mb-12">
          <MessageSquare className="mx-auto text-sage mb-6" size={24} strokeWidth={1} />
          <h2 className="text-3xl font-serif font-light tracking-tight">Guestbook</h2>
          <p className="text-[10px] text-gray-400 mt-3 tracking-[0.3em] uppercase font-light">
            Wishes
          </p>
        </div>

        {/* Submit form */}
        <form onSubmit={handleRSVP} className="space-y-4 mb-12">
          <input
            type="text"
            placeholder="성함"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full p-4 rounded-xl border border-gray-100 bg-white text-sm focus:outline-none focus:border-blush/30 transition-all font-light"
          />
          <textarea
            placeholder="축하 메시지를 남겨주세요"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            rows={4}
            className="w-full p-4 rounded-xl border border-gray-100 bg-white text-sm focus:outline-none focus:border-blush/30 transition-all font-light resize-none"
          />
          <button
            type="submit"
            className="w-full py-4 bg-blush text-white rounded-xl font-light tracking-widest text-sm hover:bg-opacity-90 transition-all shadow-lg shadow-blush/20 active:scale-[0.98]"
          >
            SEND MESSAGE
          </button>
        </form>

        {/* Infinite horizontal ticker */}
        <AnimatePresence>
          <GuestbookTicker messages={messages} />
        </AnimatePresence>
      </RevealSection>

      {/* Footer */}
      <footer className="py-24 bg-white text-center border-t border-gray-50">
        <p className="text-[10px] text-gray-300 tracking-[0.5em] uppercase font-light">
          Eternal Love
        </p>
        <p className="mt-6 text-2xl font-serif italic text-sage font-light tracking-tighter">
          Sungmin & Yeonjeong
        </p>
        <div className="mt-12 flex justify-center gap-8 text-gray-200">
          <Music size={14} strokeWidth={1} />
          <Clock size={14} strokeWidth={1} />
          <Heart size={14} strokeWidth={1} />
        </div>
        <p className="mt-12 text-[9px] text-gray-300 tracking-widest">
          © 2026 WEDDING INVITATION
        </p>
      </footer>
      {/* 여기에 라이트박스(원본 사진 보기) 컴포넌트를 추가합니다! */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            photos={ALBUM_PHOTOS}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onJump={(i) => setLightboxIndex(i)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
