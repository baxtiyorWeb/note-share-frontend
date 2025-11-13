"use client";
import { useState, useEffect, useCallback, useRef, } from 'react';
import { Heart, MessageSquare, Bookmark, Share2, Volume2, Send, Check, X, Play, Pause, Clock, UserCheck, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Confetti from 'react-confetti';

// Mock datani yangiladik
const mockReels = [
  { id: 1, author: { name: "Bexruz", username: "@coder_bex", followers: 12500 }, title: "useEffect vs useLayoutEffect – farqi nima?", sound: "Original Audio", views: 2540, likes: 450, comments: 24, saves: 120, duration: 6.8 }, // duration qo'shildi (sekundda)
  { id: 2, author: { name: "Gulnoza", username: "@frontend_guru", followers: 3200 }, title: "Tailwindda dark mode qanday ishlaydi?", sound: "Lo-Fi Beats", views: 5123, likes: 980, comments: 67, saves: 310, duration: 8.1 },
  { id: 3, author: { name: "Jasur", username: "@db_master", followers: 8900 }, title: "PostgreSQLda index qanday tezlashtiradi?", sound: "Tech Talk", views: 1800, likes: 230, comments: 12, saves: 80, duration: 5.5 },
];

// Helper function: Raqamni K, M formatida ko'rsatish
const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num;
};

// Helper function: Sekundni MM:SS formatida ko'rsatish
const formatDuration = (seconds: number): string => {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

export default function NoteStream() {
  const autoplayPlugin = Autoplay({ delay: 7000, stopOnInteraction: false }) as unknown as any;
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true },
    [autoplayPlugin]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  // Qo'shimcha state'lar
  const [isPlaying, setIsPlaying] = useState(mockReels.map(() => true));
  const [isFollowing, setIsFollowing] = useState(mockReels.map(() => false));

  const [likes, setLikes] = useState(mockReels.map(r => r.likes));
  const [isLiked, setIsLiked] = useState(mockReels.map(() => false));
  const [saves, setSaves] = useState(mockReels.map(r => r.saves));
  const [isSaved, setIsSaved] = useState(mockReels.map(() => false));
  const [copied, setCopied] = useState(false);
  const [confetti, setConfetti] = useState(false);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const currentReel = mockReels[selectedIndex];

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setShowComments(false);
    setIsPlaying(p => p.map((_, i) => i === emblaApi.selectedScrollSnap()));
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    // Embla Autoplay to'xtatish funksiyasini o'chirish
    const plugins = emblaApi.plugins() as { autoplay?: { stop: () => void } };
    plugins.autoplay?.stop();
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Video ijrosi
  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (video) {
        if (i === selectedIndex && isPlaying[i]) {
          video.play().catch(() => { });
        } else {
          video.pause();
        }
        video.muted = isMuted; // Mute state'ini har safar tekshirish
      }
    });
  }, [selectedIndex, isMuted, isPlaying]);

  const togglePlayPause = () => {
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

  const toggleFollow = () => {
    setIsFollowing(p => {
      const newFollowing = [...p];
      newFollowing[selectedIndex] = !newFollowing[selectedIndex];
      // Qo'shimcha: followers sonini o'zgartirish (agar kerak bo'lsa)
      // mockReels[selectedIndex].author.followers += newFollowing[selectedIndex] ? 1 : -1;
      return newFollowing;
    });
  };

  // Qolgan funksiyalar (toggleLike, toggleSave, shareReel, handleDoubleTap) o'zgarishsiz qoldirildi.
  // ... (toggleLike, toggleSave, shareReel funksiyalarini bu yerga joylashtiring) ...
  const handleDoubleTap = () => {
    if (isLiked[selectedIndex]) return;
    toggleLike();
    setConfetti(true);
    setTimeout(() => setConfetti(false), 2000);
  };

  const toggleLike = () => {
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


  return (
    <>
      {confetti && <Confetti recycle={false} numberOfPieces={180} gravity={0.08} />}

      <div className="relative flex flex-col h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 overflow-hidden">

        {/* Animated Background */}
        <div className="absolute inset-0 opacity-50">
          <div className="absolute inset-0 bg-gradient-to-tr from-violet-800/30 via-purple-800/20 to-pink-800/30 blur-3xl" />
        </div>



        {/* Carousel - Responsive */}
        <div className="flex-1 relative overflow-hidden flex items-center justify-center px-4 md:px-12 py-8">
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
                      width: isMobile ? '320px' : '420px',
                      paddingLeft: isMobile ? '16px' : '32px',
                      paddingRight: isMobile ? '16px' : '32px'
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
                          isActive && "ring-4 ring-violet-500/60 shadow-violet-500/40"
                        )}
                        style={{ height: isMobile ? '570px' : '680px' }}
                        whileHover={isActive ? { scale: 1.02 } : {}}
                      >
                        {/* Video */}
                        <video
                          ref={el => {
                            videoRefs.current[index] = el;
                          }}
                          src={`/videos/reel-${index + 1}.mp4`} // Video fayl nomlari mock-up
                          className="w-full h-full object-cover"
                          loop
                          muted={isMuted}
                          playsInline
                          onDoubleClick={handleDoubleTap}
                          onClick={togglePlayPause} // Video/pause click
                        />

                        {/* Play/Pause Overlay */}
                        {isActive && !isPlaying[index] && (
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
                        {isActive && isPlaying[index] && (
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
                        {isActive && (
                          <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/30">
                            <motion.div
                              className="h-full bg-gradient-to-r from-violet-500 via-pink-500 to-purple-600"
                              initial={{ width: "0%" }}
                              animate={{ width: "100%" }}
                              // Autoplay va duration'ga moslab o'zgartirdik
                              transition={{ duration: currentReel.duration, ease: "linear", repeat: Infinity }}
                            />
                          </div>
                        )}

                        {/* Duration Time (Tepa Chap Qismda) */}
                        {isActive && (
                          <div className="absolute top-5 left-5 text-white/90 text-sm md:text-base font-medium drop-shadow-md z-10 flex items-center gap-1 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full">
                            <Clock className="w-4 h-4" />
                            <span>{formatDuration(currentReel.duration)}</span>
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
                              <p className="text-white/70 text-xs md:text-sm">@{reel.author.username}</p>
                            </div>
                          </div>

                          {/* Follow Tugmasi */}
                          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                            <Button
                              className={cn(
                                "rounded-full px-5 py-3 text-sm font-semibold shadow-lg transition-all duration-300",
                                isFollowing[index] ? "bg-white text-violet-600 hover:bg-white/90" : "bg-violet-600 hover:bg-violet-700 text-white"
                              )}
                              onClick={toggleFollow}
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
                              <Clock className="w-4 h-4" />
                              {formatNumber(reel.views)} Views
                            </span>
                            <span className="flex items-center gap-1">
                              <UserPlus className="w-4 h-4" />
                              {formatNumber(reel.author.followers)} Followers
                            </span>
                          </motion.div>
                        </div>

                        {/* Sound (Tepa O'ng Qismda - Headerda Mute) */}
                        <div className="absolute top-5 right-5 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-white/80 text-sm md:text-base flex items-center gap-2">
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
                                  "w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 shadow-xl",
                                  active && color
                                )}
                                onClick={onClick}
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

        {/* Comment Sheet (Pastki Qismda) */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 max-h-[80vh] bg-black/60 backdrop-blur-3xl rounded-t-3xl border-t border-white/20 shadow-2xl z-50 flex flex-col"
            >
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-white text-xl font-bold">Comments ({formatNumber(currentReel.comments)})</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowComments(false)} className="text-white">
                  <X className="w-6 h-6" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Mock Comments */}
                {["Ajoyib! Qisqa va mazmunli.", "Rahmat, bu menga juda yordam berdi!", "PostgreSQL tezligi haqida batafsilroq video qilasizmi?"].map((c, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex gap-3"
                  >
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-pink-500 to-red-600 text-white">U</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-white font-medium text-sm">User{i + 1} <span className="text-white/50 text-xs ml-2">2h ago</span></p>
                      <p className="text-white/80 text-base">{c}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-white/50 hover:text-white ml-auto h-8 w-8 self-start"><Heart className="w-4 h-4" /></Button>
                  </motion.div>
                ))}
              </div>

              {/* Comment Input (Pastki Comment Tag Qismida) */}
              <div className="p-4 border-t border-white/10 flex gap-3 bg-black/70">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="flex-1 px-5 py-3 rounded-full bg-white/10 backdrop-blur-md text-white placeholder-white/50 focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                />
                <Button
                  size="icon"
                  className="rounded-full w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 transition-all"
                  disabled={commentText.trim() === ""}
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