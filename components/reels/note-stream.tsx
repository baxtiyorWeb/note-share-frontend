"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Heart, MessageSquare, Bookmark, Share2, Volume2, VolumeX, Send, Check, X,
  Play, Pause, Clock, UserCheck, UserPlus, Zap, TrendingUp, Lock,
  Search, Bell, Trash2, Sun, Moon,
} from 'lucide-react';
// Sizning komponentlaringizni import qilishni saqlab qoldim
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Confetti from 'react-confetti';

// --- Turlarni aniqlash (Types for clarity) ---
interface Author {
  name: string;
  username: string;
  followers: number;
  avgViews: number; // 🚀 Yangi: O'rtacha ko'rish
  rating: number; // 🚀 Yangi: Reyting (1-5)
}

interface Reel {
  id: number;
  author: Author;
  title: string;
  sound: string;
  views: number;
  likes: number;
  comments: number;
  saves: number;
  duration: number; // sekundda
  isPremium: boolean;
}

interface Comment {
  id: number;
  user: { name: string, username: string, isVerified: boolean, isPremium?: boolean };
  text: string;
  time: string;
  likes: number;
}

// --- Mock Data (O'zgartirilgan Mock Data) ---
const mockReels: Reel[] = [
  { id: 1, author: { name: "Bexruz", username: "@coder_bex", followers: 12500, avgViews: 3200, rating: 4.8 }, title: "useEffect vs useLayoutEffect – farqi nima?", sound: "Original Audio", views: 2540, likes: 450, comments: 24, saves: 120, duration: 6.8, isPremium: false },
  { id: 2, author: { name: "Gulnoza", username: "@frontend_guru", followers: 3200, avgViews: 5500, rating: 4.9 }, title: "Tailwindda dark mode qanday ishlaydi?", sound: "Lo-Fi Beats", views: 5123, likes: 980, comments: 67, saves: 310, duration: 8.1, isPremium: true },
  { id: 3, author: { name: "Jasur", username: "@db_master", followers: 8900, avgViews: 1900, rating: 4.5 }, title: "PostgreSQLda index qanday tezlashtiradi?", sound: "Tech Talk", views: 1800, likes: 230, comments: 12, saves: 80, duration: 5.5, isPremium: false },
  { id: 4, author: { name: "Ali", username: "@dev_ops", followers: 15000, avgViews: 15000, rating: 5.0 }, title: "Docker Containerlari bilan ishlash asoslari", sound: "System Sound", views: 15000, likes: 3500, comments: 120, saves: 450, duration: 7.2, isPremium: true },
];

// --- Mock Comments Data ---
const mockComments: Comment[] = [
  { id: 1, user: { name: "Diyor", username: "@diyorbek", isVerified: true }, text: "Ajoyib! Qisqa va mazmunli, rahmat! 👏", time: "2h ago", likes: 15 },
  { id: 2, user: { name: "Shaxnoza", username: "@shaxn", isVerified: false }, text: "Bu menga dark mode'ni tushunishga juda yordam berdi!", time: "1h ago", likes: 5 },
  { id: 3, user: { name: "PremiumUser", username: "@pro_coder", isVerified: true, isPremium: true }, text: "Premium kontentni kutamiz! Ko'proq shu kabi videolar kerak.", time: "30m ago", likes: 28 },
];

export default function NoteStreamPage() {
  // --- Asosiy State'lar ---
  const [isSubscriber, setIsSubscriber] = useState(true); // Default true qilib qo'yildi
  const [selectedIndex, setSelectedIndex] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [confetti, setConfetti] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // 🚀 Yangi: Qidiruv
  const [isDarkMode, setIsDarkMode] = useState(true); // 🚀 Yangi: Theme

  // --- Reel State'lar ---
  const [isPlaying, setIsPlaying] = useState(mockReels.map(() => true));
  const [isFollowing, setIsFollowing] = useState(mockReels.map(() => false));
  const [likes, setLikes] = useState(mockReels.map(r => r.likes));
  const [isLiked, setIsLiked] = useState(mockReels.map(() => false));
  const [saves, setSaves] = useState(mockReels.map(r => r.saves));
  const [isSaved, setIsSaved] = useState(mockReels.map(() => false));
  const [copied, setCopied] = useState(false);
  const [viewed, setViewed] = useState(mockReels.map(() => false)); // 🚀 Yangi: Ko'rilganlik

  // --- Embla Carousel & Refs ---
  const autoplayPlugin = Autoplay({ delay: 7000, stopOnInteraction: false }) as unknown as any;
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [autoplayPlugin]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const currentReel = mockReels[selectedIndex];
  const isCurrentReelLocked = currentReel?.isPremium && !isSubscriber;

  // --- 🚀 Yangi: Filtered Reels (Qidiruv natijasi) ---
  const filteredReels = useMemo(() => {
    if (!searchQuery) return mockReels;
    return mockReels.filter(reel =>
      reel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reel.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reel.author.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // --- Helper Functions ---
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num;
  };

  const formatDuration = (seconds: number): string => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // --- Carousel Select Callback ---
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const newIndex = emblaApi.selectedScrollSnap();
    setSelectedIndex(newIndex);
    setShowComments(false);
    // Faqat tanlangan videoni ijro etishni boshlash/davom ettirish
    setIsPlaying(p => p.map((_, i) => i === newIndex));
  }, [emblaApi]);

  // --- 🚀 Yangi: Video tugashini kuzatish (Autoplay next) ---
  const handleVideoEnded = useCallback(() => {
    setViewed(p => {
      const newViewed = [...p];
      newViewed[selectedIndex] = true; // Ko'rilgan deb belgilash
      return newViewed;
    });

    if (emblaApi) {
      emblaApi.scrollNext(); // Keyingi Reel'ga o'tish
    }
  }, [emblaApi, selectedIndex]);

  // --- useEffect'lar ---
  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (video) {
        // Video Event Listenerlarini yangilash
        video.removeEventListener('ended', handleVideoEnded);
        if (i === selectedIndex) {
          video.addEventListener('ended', handleVideoEnded);
        }

        // Premium kontent bloklangan bo'lsa, videoni to'xtatish
        if (isCurrentReelLocked && i === selectedIndex) {
          video.pause();
        } else if (i === selectedIndex && isPlaying[i]) {
          video.play().catch(() => { });
        } else {
          video.pause();
        }
        video.muted = isMuted;
      }
    });
    // Cleanup: Keyingi Reel'ga o'tishdan oldin listenerni o'chirish
    return () => {
      if (videoRefs.current[selectedIndex]) {
        videoRefs.current[selectedIndex]?.removeEventListener('ended', handleVideoEnded);
      }
    };
  }, [selectedIndex, isMuted, isPlaying, isCurrentReelLocked, handleVideoEnded]);


  // --- Event Handlers ---
  const togglePlayPause = () => {
    if (isCurrentReelLocked) return;

    setIsPlaying(p => {
      const newPlaying = [...p];
      const newState = !newPlaying[selectedIndex];
      newPlaying[selectedIndex] = newState;

      const video = videoRefs.current[selectedIndex];
      if (video) {
        newState ? video.play().catch(() => { }) : video.pause();
      }
      return newPlaying;
    });
  };

  const handleDoubleTap = () => {
    if (isCurrentReelLocked) return; // 🚀 Premium: Bloklangan bo'lsa, ishlamaydi
    if (!isLiked[selectedIndex]) { // Faqat like qo'yilmagan bo'lsa confetti chiqar
      toggleLike();
      setConfetti(true);
      setTimeout(() => setConfetti(false), 2000);
    }
  };

  const toggleLike = () => {
    // 🚀 Yangi: "Undo" Like funksiyasi uchun like sonini avtomatik sozlash
    setIsLiked(p => {
      const newLiked = [...p];
      const currentState = newLiked[selectedIndex];
      newLiked[selectedIndex] = !currentState;

      setLikes(l => {
        const newLikes = [...l];
        newLikes[selectedIndex] += currentState ? -1 : 1;
        return newLikes;
      });

      return newLiked;
    });
  };

  const toggleSave = () => {
    if (isCurrentReelLocked) return;
    setIsSaved(p => {
      const newSaved = [...p];
      newSaved[selectedIndex] = !newSaved[selectedIndex];
      return newSaved;
    });
    setSaves(p => {
      const newSaves = [...p];
      newSaves[selectedIndex] += isSaved[selectedIndex] ? -1 : 1;
      return newSaves;
    });
  };

  const shareReel = async () => {
    const url = `${window.location.origin}/reel/${currentReel.id}`;
    if (navigator.share) {
      await navigator.share({ title: currentReel.title, url });
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const subscribeToPremium = () => {
    // Premium obuna logikasi
    setIsSubscriber(true);
  };

  // 🚀 Yangi: Theme Switch
  const toggleTheme = () => {
    setIsDarkMode(p => !p);
  };

  return (
    <>
      {confetti && <Confetti recycle={false} numberOfPieces={180} gravity={0.08} />}

      {/* 🚀 Yangi: Theme Class */}
      <div className={cn(
        "relative flex flex-col h-screen overflow-hidden",
        isDarkMode ? "bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-white" : "bg-white text-gray-900"
      )}>

        {/* Animated Background */}
        <div className="absolute inset-0 opacity-50">
          <div className={cn(
            "absolute inset-0 blur-3xl",
            isDarkMode ? "bg-gradient-to-tr from-violet-800/30 via-purple-800/20 to-pink-800/30" : "bg-gradient-to-tr from-violet-200/50 via-purple-200/40 to-pink-200/50"
          )} />
        </div>


        {/* --- Carousel Qismi --- */}
        <div className="flex-1 select-none relative overflow-hidden flex items-center justify-center px-4 md:px-12 py-8 ">
          <div className="embla w-full max-w-7xl" ref={emblaRef}>
            <div className="embla__container flex items-center">
              {filteredReels.map((reel, index) => {
                const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                const globalIndex = mockReels.findIndex(r => r.id === reel.id);
                const isActive = isMobile ? globalIndex === selectedIndex : globalIndex - 1 === selectedIndex;

                if (filteredReels.length > 0 && globalIndex === -1) return null; // Qidiruvdan yo'q bo'lsa o'tkazib yuborish

                const isReelLocked = reel.isPremium && !isSubscriber;

                return (
                  <div
                    key={reel.id}
                    className="embla__slide flex-none"
                    style={{
                      width: isMobile ? '100%' : '420px',
                      paddingLeft: isMobile ? '0' : '32px',
                      paddingRight: isMobile ? '0' : '32px'
                    }}
                  >
                    <motion.div
                      animate={{
                        scale: isActive ? 1 : (isMobile ? 0.85 : 0.92),
                        opacity: isActive ? 1 : (isMobile ? 0.6 : 0.75),
                        filter: isActive ? 'blur(0px)' : (isMobile ? 'blur(1.5px)' : 'blur(1px)')
                      }}
                      transition={{ type: "spring", stiffness: 100, damping: 10 }}
                      className="relative h-full"
                      style={{ perspective: 1000 }}
                    >
                      {/* Card */}
                      <motion.div
                        className={cn(
                          "relative rounded-3xl md:rounded-4xl overflow-hidden shadow-2xl transition-all duration-500",
                          isDarkMode
                            ? "bg-gradient-to-br from-white/8 to-white/4 backdrop-blur-3xl border border-white/20 before:from-black/70 before:via-black/30"
                            : "bg-gray-100/80 backdrop-blur-xl border border-gray-300 before:from-black/50 before:via-black/10",
                          "before:absolute before:inset-0 before:bg-gradient-to-t before:to-transparent",
                          isActive && "ring-0 ring-offset-0 ring-offset-transparent shadow-violet-500/40"
                        )}
                        style={{ height: isMobile ? '95vh' : '680px' }}
                        whileHover={isActive ? { scale: 1.02 } : {}}
                      >
                        {/* Video */}
                        <video
                          ref={el => { videoRefs.current[globalIndex] = el; }}
                          src={`/videos/reel-${globalIndex + 2}.mp4`}
                          className="w-full h-full object-cover"
                          loop
                          muted={isMuted}
                          playsInline
                          onDoubleClick={handleDoubleTap}
                          onClick={togglePlayPause}
                        />

                        {/* 🚀 Yangi: Premium Blur/Fade Overlay */}
                        {isActive && isReelLocked && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-lg text-white p-8 text-center"
                          >
                            <Lock className="w-16 h-16 text-yellow-400 mb-4" />
                            <h3 className="text-2xl font-bold mb-2">Premium Kontent</h3>
                            <p className="text-white/80 mb-6">Ushbu videoni ko'rish uchun Premium obunani faollashtiring.</p>
                            <Button
                              className="rounded-full px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold shadow-lg"
                              onClick={subscribeToPremium}
                            >
                              <Zap className="w-5 h-5 mr-2 fill-black" /> Premiumga o'tish
                            </Button>
                          </motion.div>
                        )}


                        {/* Play/Pause Overlay */}
                        {isActive && !isReelLocked && !isPlaying[globalIndex] && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/30"
                          >
                            <Pause className="w-20 h-20 text-white/90 drop-shadow-lg" />
                          </motion.div>
                        )}
                        {isActive && isPlaying[globalIndex] && !isReelLocked && (
                          <motion.div
                            key="play-icon"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="absolute bottom-5 left-5 bg-black/40 backdrop-blur-md p-2 rounded-full text-white/80"
                          >
                            <Play className="w-5 h-5 fill-current" />
                          </motion.div>
                        )}

                        {/* 🚀 Yangi: Mute/Unmute Ikonkasi (Top Right) */}
                        {isActive && !isReelLocked && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2, delay: 0.5 }}
                            className="absolute top-5 right-5 z-10"
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 text-white/80"
                              onClick={(e) => { e.stopPropagation(); setIsMuted(p => !p); }}
                            >
                              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </Button>
                          </motion.div>
                        )}

                        {/* Progress Bar */}
                        {isActive && !isReelLocked && (
                          <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/30">
                            {/* 🚀 Yangi: Ko'rilgan Reel'lar uchun rang farqi */}
                            {viewed[globalIndex] && (
                              <div className="absolute inset-0 h-full bg-gray-500/50" />
                            )}
                            <motion.div
                              className="h-full bg-gradient-to-r from-violet-500 via-pink-500 to-purple-600"
                              initial={{ width: "0%" }}
                              animate={{ width: isPlaying[globalIndex] ? "100%" : "0%" }}
                              transition={{ duration: reel.duration, ease: "linear", repeat: isPlaying[globalIndex] ? Infinity : 0 }}
                            />
                          </div>
                        )}

                        {/* Duration Time & Premium Tag */}
                        {isActive && (
                          <div className="absolute top-5 left-5 text-white/90 text-sm md:text-base font-medium drop-shadow-md z-10 flex items-center gap-1 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full">
                            <Clock className="w-4 h-4" />
                            <span>{formatDuration(reel.duration)}</span>
                          </div>
                        )}
                        {reel.isPremium && (
                          <div className="absolute top-5 right-5 z-10 flex items-center gap-1 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs md:text-sm font-bold shadow-lg">
                            <Zap className="w-4 h-4 fill-black" />
                            PREMIUM
                          </div>
                        )}

                        {/* Author va Follow */}
                        <div className="absolute bottom-5 left-5 right-5 text-white flex items-center justify-between">
                          <div className="flex items-center gap-3 group">
                            <Avatar className="w-12 h-12 md:w-14 md:h-14 ring-2 ring-white/40">
                              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold text-lg">
                                {reel.author.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-base md:text-lg font-bold drop-shadow-md">{reel.author.name}</p>
                              <p className="text-white/70 text-xs md:text-sm">{reel.author.username}</p>
                            </div>
                            {/* 🚀 Yangi: Avtor Statistika Popoveri (Desktopda ishlatiladi) */}
                            <div className={cn(
                              "absolute left-0 bottom-full mb-2 p-3 rounded-lg shadow-xl bg-black/80 backdrop-blur-md text-white/90 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none hidden md:block"
                            )}>
                              <p className='font-bold mb-1'>Author Stats:</p>
                              <p><TrendingUp className='w-3 h-3 inline mr-1' /> Avg Views: {formatNumber(reel.author.avgViews)}</p>
                              <p><Zap className='w-3 h-3 inline mr-1 fill-yellow-400' /> Rating: {reel.author.rating} / 5.0</p>
                            </div>
                          </div>

                          {/* Follow Tugmasi */}
                          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                            <Button
                              className={cn(
                                "rounded-full px-5 py-3 text-sm font-semibold shadow-lg transition-all duration-300",
                                isFollowing[globalIndex] ? "bg-white text-violet-600 hover:bg-white/90" : "bg-violet-600 hover:bg-violet-700 text-white"
                              )}
                              onClick={() => setIsFollowing(p => { const n = [...p]; n[globalIndex] = !n[globalIndex]; return n; })}
                            >
                              {isFollowing[globalIndex] ? <><UserCheck className="w-4 h-4 mr-2" /> Following</> : <><UserPlus className="w-4 h-4 mr-2" /> Follow</>}
                            </Button>
                          </motion.div>
                        </div>


                        {/* Caption, Views, Sound */}
                        <div className="absolute bottom-24 left-5 right-20 text-white space-y-2">
                          <p className="text-lg md:text-xl font-bold line-clamp-2 drop-shadow-xl">{reel.title}</p>
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-4 text-sm text-white/80 font-medium"
                          >
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              {formatNumber(reel.views)} Views
                            </span>
                            <span className="flex items-center gap-1">
                              <UserPlus className="w-4 h-4" />
                              {formatNumber(reel.author.followers)} Followers
                            </span>
                          </motion.div>
                        </div>

                        {/* Sound (Pastki Qismda) */}
                        <div className="absolute bottom-[190px] left-5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full text-white/80 text-sm md:text-base flex items-center gap-2">
                          <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
                          {reel.sound}
                        </div>


                        {/* Actions (O'ng Tomonda) */}
                        <div className="absolute right-4 bottom-28 flex flex-col gap-6">
                          {[{ Icon: Heart, count: likes[globalIndex], active: isLiked[globalIndex], color: "text-red-500", onClick: toggleLike },
                          { Icon: MessageSquare, count: reel.comments, onClick: () => setShowComments(true) },
                          { Icon: Bookmark, count: saves[globalIndex], active: isSaved[globalIndex], onClick: toggleSave },
                          { Icon: Share2, onClick: shareReel }
                          ].map(({ Icon, count, active, color, onClick }, i) => (
                            <motion.div key={i} whileTap={{ scale: 0.8 }} className="flex flex-col items-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 shadow-xl text-white",
                                  active && color
                                )}
                                onClick={onClick}
                                disabled={Icon !== Heart && isReelLocked}
                              >
                                <Icon className="w-7 h-7 md:w-8 md:h-8" fill={Icon === Heart && active ? "currentColor" : "none"} />
                              </Button>
                              {count !== undefined && (
                                <span className="text-sm md:text-base mt-1 text-white/80 font-medium">
                                  {formatNumber(count)}
                                </span>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Comment Sheet */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 max-h-[80vh] bg-black/90 backdrop-blur-3xl rounded-t-3xl border-t-4 border-violet-500/50 shadow-2xl z-50 flex flex-col"
            >
              <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-black/90 z-10">
                <h3 className="text-white text-xl md:text-2xl font-extrabold flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-violet-400" />
                  Izohlar ({formatNumber(currentReel?.comments || 0)})
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setShowComments(false)} className="text-white/80 hover:bg-white/10">
                  <X className="w-6 h-6" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Mock Comments */}
                {mockComments.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex gap-3 items-start p-3 bg-white/5 rounded-xl transition-all hover:bg-white/10"
                  >
                    <Avatar className="w-10 h-10 shrink-0 mt-1">
                      <AvatarFallback className={cn(
                        "font-bold",
                        c.user.isPremium ? "bg-yellow-500 text-black" : "bg-gradient-to-br from-pink-500 to-red-600 text-white"
                      )}>
                        {c.user.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-semibold text-sm">@{c.user.username}</p>
                        {c.user.isVerified && <Check className="w-4 h-4 text-blue-400 fill-blue-400" />}
                        {c.user.isPremium && <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                        <span className="text-white/50 text-xs ml-auto">{c.time}</span>
                      </div>
                      <p className="text-white/90 text-base">{c.text}</p>
                    </div>
                    <div className="flex flex-col items-center self-start ml-2">
                      {/* 🚀 Yangi: Izohni O'chirish (Mock) */}
                      {c.user.username === "@diyorbek" && ( // O'zimizning izohimiz deb faraz qilaylik
                        <Button variant="ghost" size="icon" className="text-white/50 hover:text-red-500 h-8 w-8 transition-colors mb-1">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="text-white/50 hover:text-red-500 h-8 w-8 transition-colors">
                        <Heart className="w-4 h-4" />
                      </Button>
                      <span className='text-xs text-white/60'>{c.likes}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Comment Input */}
              <div className="p-4 border-t border-white/10 flex gap-3 bg-black/70 sticky bottom-0">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="flex-1 px-5 py-3 rounded-full bg-white/10 backdrop-blur-md text-white placeholder-white/50 focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                />
                <Button
                  size="icon"
                  className="rounded-full w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg"
                  disabled={commentText.trim() === ""}
                  onClick={() => { setCommentText(""); /* Izoh yuborish logikasi */ }}
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Copied Toast */}
        <AnimatePresence>
          {copied && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/80 backdrop-blur-xl text-white rounded-full flex items-center gap-2 shadow-2xl z-50"
            >
              <Check className="w-5 h-5 text-green-400" />
              Link copied!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}