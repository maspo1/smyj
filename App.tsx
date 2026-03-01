/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Calendar as CalendarIcon, 
  MapPin, 
  Copy, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare,
  Music,
  Clock
} from 'lucide-react';

// --- Types ---
interface BankAccount {
  owner: string;
  bank: string;
  number: string;
}

interface GuestMessage {
  name: string;
  message: string;
  date: string;
}

// --- Constants ---
const WEDDING_DATE = new Date('2026-06-20T12:00:00');
const GROOM_ACCOUNTS: BankAccount[] = [
  { owner: '김철수', bank: '신한은행', number: '110-123-456789' },
  { owner: '김영희 (부)', bank: '국민은행', number: '123456-01-123456' }
];
const BRIDE_ACCOUNTS: BankAccount[] = [
  { owner: '이영희', bank: '우리은행', number: '1002-123-456789' },
  { owner: '이갑수 (부)', bank: '농협은행', number: '302-1234-5678-90' }
];

// --- Components ---

const Section = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={ref} 
      className={`py-16 px-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}
    >
      {children}
    </section>
  );
};

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = WEDDING_DATE.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex justify-center gap-4 mt-8">
      {[
        { label: 'DAYS', value: timeLeft.days },
        { label: 'HOUR', value: timeLeft.hours },
        { label: 'MIN', value: timeLeft.minutes },
        { label: 'SEC', value: timeLeft.seconds }
      ].map((item) => (
        <div key={item.label} className="flex flex-col items-center">
          <span className="text-2xl font-serif text-blush">{item.value}</span>
          <span className="text-[10px] tracking-widest text-gray-400">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

const Calendar = () => {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const startDay = 1; // Assuming June 2026 starts on Monday (just for visual)
  
  return (
    <div className="mt-10 max-w-xs mx-auto">
      <div className="text-center mb-4 font-serif text-lg">2026. 06. 20</div>
      <div className="calendar-grid text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <div key={d} className="text-[10px] text-gray-400 mb-2">{d}</div>
        ))}
        {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {days.map(d => (
          <div key={d} className={`calendar-day ${d === 20 ? 'active' : ''}`}>
            {d}
          </div>
        ))}
      </div>
    </div>
  );
};

const Accordion = ({ title, accounts }: { title: string, accounts: BankAccount[] }) => {
  const [isOpen, setIsOpen] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('계좌번호가 복사되었습니다.');
  };

  return (
    <div className="border-b border-gray-100">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex justify-between items-center text-left"
      >
        <span className="font-medium text-gray-700">{title}</span>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
        <div className="pb-4 space-y-4">
          {accounts.map((acc, idx) => (
            <div key={idx} className="bg-ivory p-3 rounded-lg flex justify-between items-center">
              <div>
                <div className="text-xs text-gray-500">{acc.bank}</div>
                <div className="text-sm font-medium">{acc.number}</div>
                <div className="text-xs text-gray-400">{acc.owner}</div>
              </div>
              <button 
                onClick={() => copyToClipboard(acc.number)}
                className="p-2 text-blush hover:bg-white rounded-full transition-colors"
              >
                <Copy size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [messages, setMessages] = useState<GuestMessage[]>([
    { name: '민수', message: '결혼 너무 축하드려요! 행복하게 잘 사세요!', date: '2026.02.28' },
    { name: '지혜', message: '드디어 가는구나! 꽃길만 걷자 친구야!', date: '2026.02.28' }
  ]);
  const [newName, setNewName] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const handleRSVP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newMessage) return;
    const msg: GuestMessage = {
      name: newName,
      message: newMessage,
      date: new Date().toLocaleDateString()
    };
    setMessages([msg, ...messages]);
    setNewName('');
    setNewMessage('');
  };

  return (
    <div className="app-container">
      {/* 1. Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden bg-ivory">
        <motion.div 
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 z-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1000" 
            alt="Wedding Cover"
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        
        <div className="relative z-10 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
          >
            <p className="text-sm tracking-[0.3em] text-gray-600 uppercase">The Wedding of</p>
            <h1 className="text-5xl mt-4 font-serif italic text-ink">Chulsoo & Younghee</h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="flex flex-col items-center"
          >
            <div className="h-px w-12 bg-blush my-4"></div>
            <p className="text-lg font-serif">2026. 06. 20. SAT. 12:00 PM</p>
            <p className="text-sm text-gray-500 mt-2">Grand Ballroom, Seoul Hotel</p>
          </motion.div>
        </div>

        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 text-blush"
        >
          <ChevronDown size={24} />
        </motion.div>
      </section>

      {/* 2. Greeting Section */}
      <Section className="bg-white text-center">
        <Heart className="mx-auto text-blush mb-8" size={32} fill="currentColor" opacity={0.2} />
        <div className="space-y-6">
          <p className="font-serif italic text-lg text-sage">
            "서로의 이름을 부르는 것만으로도<br/>
            가슴 벅찬 설렘이 되는 사람을 만났습니다."
          </p>
          <div className="text-sm leading-relaxed text-gray-600 space-y-4">
            <p>
              곁에 있을 때 가장 나다운 모습이 되게 하는 한 사람,<br/>
              꿈꾸던 미래를 함께 그려갈 수 있는 소중한 사람을 만나<br/>
              이제 저희 두 사람, 사랑의 결실을 맺으려 합니다.
            </p>
            <p>
              저희의 새로운 시작을 축복해 주시면<br/>
              더없는 기쁨으로 간직하겠습니다.
            </p>
          </div>
          
          <div className="pt-10 space-y-2">
            <div className="flex justify-center items-center gap-4">
              <span className="text-sm">김판수 · 박말순</span>
              <span className="text-xs text-gray-400">의 장남</span>
              <span className="font-medium">철수</span>
            </div>
            <div className="flex justify-center items-center gap-4">
              <span className="text-sm">이갑수 · 최순자</span>
              <span className="text-xs text-gray-400">의 장녀</span>
              <span className="font-medium">영희</span>
            </div>
          </div>
        </div>
      </Section>

      {/* 3. Countdown Section */}
      <Section className="bg-ivory">
        <div className="text-center">
          <CalendarIcon className="mx-auto text-sage mb-4" size={24} />
          <h2 className="text-2xl font-serif">Save the Date</h2>
          <Calendar />
          <CountdownTimer />
        </div>
      </Section>

      {/* 4. Gallery Section */}
      <Section className="bg-white">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-serif">Gallery</h2>
          <p className="text-xs text-gray-400 mt-2 tracking-widest uppercase">Our Moments</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.02 }}
              className="aspect-[3/4] overflow-hidden rounded-sm bg-gray-100"
            >
              <img 
                src={`https://picsum.photos/seed/wedding${i}/600/800`} 
                alt={`Gallery ${i}`}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          ))}
        </div>
      </Section>

      {/* 5. Location Section */}
      <Section className="bg-ivory">
        <div className="text-center mb-8">
          <MapPin className="mx-auto text-blush mb-4" size={24} />
          <h2 className="text-2xl font-serif">Location</h2>
          <div className="mt-6 space-y-2">
            <p className="font-medium">서울호텔 그랜드볼룸 2층</p>
            <p className="text-sm text-gray-500">서울특별시 강남구 테헤란로 123</p>
            <p className="text-sm text-gray-500">TEL. 02-123-4567</p>
          </div>
        </div>
        
        {/* Map Placeholder */}
        <div className="w-full aspect-video bg-gray-200 rounded-xl overflow-hidden relative group cursor-pointer">
          <img 
            src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1000" 
            alt="Map Placeholder"
            className="w-full h-full object-cover opacity-80"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
            <div className="bg-white px-4 py-2 rounded-full text-xs font-medium shadow-lg flex items-center gap-2">
              <MapPin size={14} /> 네이버 지도로 보기
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <div>
            <h4 className="text-sm font-bold text-sage mb-2 flex items-center gap-2">
              <div className="w-1 h-1 bg-sage rounded-full"></div> 지하철 안내
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              2호선 강남역 12번 출구 도보 5분 거리<br/>
              9호선 신논현역 4번 출구 도보 10분 거리
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold text-sage mb-2 flex items-center gap-2">
              <div className="w-1 h-1 bg-sage rounded-full"></div> 버스 안내
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              강남역 사거리 정류장 하차<br/>
              간선: 140, 402, 421 / 지선: 3412, 4412
            </p>
          </div>
        </div>
      </Section>

      {/* 6. Bank Info Section */}
      <Section className="bg-white">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif">Account</h2>
          <p className="text-xs text-gray-400 mt-2">마음 전하실 곳</p>
        </div>
        <div className="space-y-2">
          <Accordion title="신랑측 계좌번호" accounts={GROOM_ACCOUNTS} />
          <Accordion title="신부측 계좌번호" accounts={BRIDE_ACCOUNTS} />
        </div>
      </Section>

      {/* 7. RSVP / Guestbook Section */}
      <Section className="bg-ivory">
        <div className="text-center mb-8">
          <MessageSquare className="mx-auto text-sage mb-4" size={24} />
          <h2 className="text-2xl font-serif">Guestbook</h2>
          <p className="text-xs text-gray-400 mt-2">축하의 한마디를 남겨주세요</p>
        </div>

        <form onSubmit={handleRSVP} className="space-y-4 mb-10">
          <input 
            type="text" 
            placeholder="성함"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-blush"
          />
          <textarea 
            placeholder="축하 메시지를 남겨주세요"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            rows={3}
            className="w-full p-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:border-blush resize-none"
          />
          <button 
            type="submit"
            className="w-full py-3 bg-blush text-white rounded-lg font-medium text-sm hover:bg-opacity-90 transition-all"
          >
            메시지 남기기
          </button>
        </form>

        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-4 rounded-xl shadow-sm"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm">{msg.name}</span>
                  <span className="text-[10px] text-gray-400">{msg.date}</span>
                </div>
                <p className="text-sm text-gray-600">{msg.message}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Section>

      {/* Footer */}
      <footer className="py-12 bg-white text-center border-t border-gray-100">
        <p className="text-xs text-gray-400 tracking-widest uppercase">Thank You</p>
        <p className="mt-4 text-sm font-serif italic text-sage">Chulsoo & Younghee</p>
        <div className="mt-8 flex justify-center gap-6 text-gray-300">
          <Music size={16} />
          <Clock size={16} />
          <Heart size={16} />
        </div>
      </footer>
    </div>
  );
}
