"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { Heart, MessageSquare, Bookmark, Share2, Volume2, Send, Check, X, Play, Pause, Clock, UserCheck, UserPlus, Zap, TrendingUp, Lock } from 'lucide-react';
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
  isPremium: boolean; // 🚀 Premium funksiyasi
}

// --- Mock Data (O'zgartirilgan Mock Data) ---
const mockReels: Reel[] = [
  { id: 1, author: { name: "Bexruz", username: "@coder_bex", followers: 12500 }, title: "useEffect vs useLayoutEffect – farqi nima?", sound: "Original Audio", views: 2540, likes: 450, comments: 24, saves: 120, duration: 6.8, isPremium: false },
  { id: 2, author: { name: "Gulnoza", username: "@frontend_guru", followers: 3200 }, title: "Tailwindda dark mode qanday ishlaydi?", sound: "Lo-Fi Beats", views: 5123, likes: 980, comments: 67, saves: 310, duration: 8.1, isPremium: true }, // Premium Kontent
  { id: 3, author: { name: "Jasur", username: "@db_master", followers: 8900 }, title: "PostgreSQLda index qanday tezlashtiradi?", sound: "Tech Talk", views: 1800, likes: 230, comments: 12, saves: 80, duration: 5.5, isPremium: false },
  { id: 4, author: { name: "Ali", username: "@dev_ops", followers: 15000 }, title: "Docker Containerlari bilan ishlash asoslari", sound: "System Sound", views: 15000, likes: 3500, comments: 120, saves: 450, duration: 7.2, isPremium: true }, // Premium Kontent
];

// --- Mock Comments Data (Izoh Dizaynini Kengaytirish uchun) ---
const mockComments = [
  { id: 1, user: { name: "Diyor", username: "@diyorbek", isVerified: true }, text: "Ajoyib! Qisqa va mazmunli, rahmat! 👏", time: "2h ago", likes: 15 },
  { id: 2, user: { name: "Shaxnoza", username: "@shaxn", isVerified: false }, text: "Bu menga dark mode'ni tushunishga juda yordam berdi!", time: "1h ago", likes: 5 },
  { id: 3, user: { name: "PremiumUser", username: "@pro_coder", isVerified: true, isPremium: true }, text: "Premium kontentni kutamiz! Ko'proq shu kabi videolar kerak.", time: "30m ago", likes: 28 },
];

export default function NoteStreamPage() {
  // --- Asosiy State'lar ---
  const [isSubscriber, setIsSubscriber] = useState(false); // 🚀 Premium State
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  // --- Reel State'lar ---
  const [isPlaying, setIsPlaying] = useState(mockReels.map(() => true));
  const [isFollowing, setIsFollowing] = useState(mockReels.map(() => false));
  const [likes, setLikes] = useState(mockReels.map(r => r.likes));
  const [isLiked, setIsLiked] = useState(mockReels.map(() => false));
  const [saves, setSaves] = useState(mockReels.map(r => r.saves));
  const [isSaved, setIsSaved] = useState(mockReels.map(() => false));
  const [copied, setCopied] = useState(false);
  const [confetti, setConfetti] = useState(false);

  // --- Embla Carousel & Refs ---
  const autoplayPlugin = Autoplay({ delay: 7000, stopOnInteraction: false }) as unknown as any;
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [autoplayPlugin]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const currentReel = mockReels[selectedIndex];
  const isCurrentReelLocked = currentReel.isPremium && !isSubscriber; // 🚀 Premium Logic

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
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setShowComments(false);
    // Faqat tanlangan videoni ijro etishni boshlash/davom ettirish
    setIsPlaying(p => p.map((_, i) => i === emblaApi.selectedScrollSnap()));
  }, [emblaApi]);

  // --- useEffect'lar ---
  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    // Autoplayni o'chirib qo'yish
    const plugins = emblaApi.plugins() as { autoplay?: { stop: () => void } };
    plugins.autoplay?.stop();
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (video) {
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
  }, [selectedIndex, isMuted, isPlaying, isCurrentReelLocked]);


  // --- Event Handlers ---
  const togglePlayPause = () => {
    if (isCurrentReelLocked) return; // 🚀 Premium: Bloklangan bo'lsa, ishlamaydi

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
    if (isLiked[selectedIndex] || isCurrentReelLocked) return; // 🚀 Premium: Bloklangan bo'lsa, ishlamaydi
    toggleLike();
    setConfetti(true);
    setTimeout(() => setConfetti(false), 2000);
  };

  const toggleLike = () => {
    // 🚀 Premium: Logikada bloklash mumkin, lekin odatda Like barcha uchun ochiq bo'ladi
    setIsLiked(p => {
      const newLiked = [...p];
      newLiked[selectedIndex] = !newLiked[selectedIndex];
      return newLiked;
    });
    setLikes(p => {
      const newLikes = [...p];
      newLikes[selectedIndex] += isLiked[selectedIndex] ? -1 : 1;
      return newLikes;
    });
  };

  const toggleSave = () => {
    if (isCurrentReelLocked) return; // 🚀 Premium: Bloklangan bo'lsa, ishlamaydi
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

  // 🚀 Premium: Obuna bo'lish funksiyasi
  const subscribeToPremium = () => {
    setIsSubscriber(true);
  };


  return (
    <>
      {confetti && <Confetti recycle={false} numberOfPieces={180} gravity={0.08} />}

      <div className="relative flex flex-col h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 overflow-hidden">

        {/* Animated Background */}
        <div className="absolute inset-0 opacity-50">
          <div className="absolute inset-0 bg-gradient-to-tr from-violet-800/30 via-purple-800/20 to-pink-800/30 blur-3xl" />
        </div>




        {/* Carousel - Responsive */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center px-4 md:px-12 py-8 pt-20"> {/* pt-20 Headerni hisobga olish */}
          <div className="embla w-full max-w-7xl" ref={emblaRef}>
            <div className="embla__container flex items-center">
              {mockReels.map((reel, index) => {
                const isActive = index === selectedIndex;
                const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

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
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="relative h-full"
                      style={{ perspective: 1200 }}
                    >
                      {/* Card */}
                      <motion.div
                        className={cn(
                          "relative rounded-3xl md:rounded-4xl overflow-hidden shadow-2xl",
                          "bg-gradient-to-br from-white/8 to-white/4 backdrop-blur-3xl",
                          "border border-white/20",
                          "before:absolute before:inset-0 before:bg-gradient-to-t before:from-black/70 before:via-black/30 before:to-transparent",
                          isActive && "ring-0 ring-violet-500/60 shadow-violet-500/40"
                        )}
                        style={{ height: isMobile ? '570px' : '680px' }}
                        whileHover={isActive ? { scale: 1.02 } : {}}
                      >
                        {/* Video */}
                        <video
                          ref={el => { videoRefs.current[index] = el; }}
                          src={`/videos/reel-${index + 2}.mp4`} // Video fayl nomlari mock-up
                          className="w-full h-full object-cover"
                          loop
                          muted={isMuted}
                          playsInline
                          onDoubleClick={handleDoubleTap}
                          onClick={togglePlayPause}
                        />

                        {/* 🚀 Premium Overlay (Bloklash) */}
                        {isActive && reel.isPremium && !isSubscriber && (
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
                        {isActive && !isCurrentReelLocked && !isPlaying[index] && (
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
                        {isActive && isPlaying[index] && !isCurrentReelLocked && (
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

                        {/* Progress Bar (Video Line - Tepa Qismda) */}
                        {isActive && !isCurrentReelLocked && (
                          <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/30">
                            <motion.div
                              className="h-full bg-gradient-to-r from-violet-500 via-pink-500 to-purple-600"
                              initial={{ width: "0%" }}
                              animate={{ width: "100%" }}
                              transition={{ duration: reel.duration, ease: "linear", repeat: Infinity }}
                            />
                          </div>
                        )}

                        {/* Duration Time (Tepa Chap Qismda) */}
                        {isActive && (
                          <div className="absolute top-5 left-5 text-white/90 text-sm md:text-base font-medium drop-shadow-md z-10 flex items-center gap-1 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full">
                            <Clock className="w-4 h-4" />
                            <span>{formatDuration(reel.duration)}</span>
                          </div>
                        )}

                        {/* 🚀 Premium Tag (Tepa O'ng Qismda) */}
                        {reel.isPremium && (
                          <div className="absolute top-5 right-5 z-10 flex items-center gap-1 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs md:text-sm font-bold shadow-lg">
                            <Zap className="w-4 h-4 fill-black" />
                            PREMIUM
                          </div>
                        )}

                        {/* Author va Follow (Pastki Chap Tomonda) */}
                        <div className="absolute bottom-5 left-5 right-5 text-white flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12 md:w-14 md:h-14 ring-2 ring-white/40">
                              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold text-lg">
                                {reel.author.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-base md:text-lg font-bold drop-shadow-md">{reel.author.name}</p>
                              <p className="text-white/70 text-xs md:text-sm">{reel.author.username}</p>
                            </div>
                          </div>

                          {/* Follow Tugmasi */}
                          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                            <Button
                              className={cn(
                                "rounded-full px-5 py-3 text-sm font-semibold shadow-lg transition-all duration-300",
                                isFollowing[index] ? "bg-white text-violet-600 hover:bg-white/90" : "bg-violet-600 hover:bg-violet-700 text-white"
                              )}
                              onClick={() => { /* toggleFollow funksiyasi joyiga qo'yiladi */ }}
                            >
                              {isFollowing[index] ? <><UserCheck className="w-4 h-4 mr-2" /> Following</> : <><UserPlus className="w-4 h-4 mr-2" /> Follow</>}
                            </Button>
                          </motion.div>
                        </div>


                        {/* Caption va Views/Followers */}
                        <div className="absolute bottom-24 left-5 right-20 text-white space-y-2">
                          <p className="text-lg md:text-xl font-bold line-clamp-2 drop-shadow-xl">{reel.title}</p>

                          {/* Views va Followers Ko'rsatkichlari */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-4 text-sm text-white/80 font-medium"
                          >
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" /> {/* TrendingUp ikonkasi qo'shildi */}
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
                          {[{ Icon: Heart, count: likes[index], active: isLiked[index], color: "text-red-500", onClick: toggleLike },
                          { Icon: MessageSquare, count: reel.comments, onClick: () => setShowComments(true) },
                          { Icon: Bookmark, count: saves[index], active: isSaved[index], onClick: toggleSave },
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
                                disabled={Icon !== Heart && isCurrentReelLocked} // 🚀 Premium: Save/Comment bloklanishi mumkin
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

        {/* Comment Sheet (Izoh Qismi Dizayni Yaxshilandi) */}
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
                  Izohlar ({formatNumber(currentReel.comments)})
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
                        {c.user.isPremium && <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />} {/* Premium Label */}
                        <span className="text-white/50 text-xs ml-auto">{c.time}</span>
                      </div>
                      <p className="text-white/90 text-base">{c.text}</p>
                    </div>
                    <div className="flex flex-col items-center self-start ml-2">
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