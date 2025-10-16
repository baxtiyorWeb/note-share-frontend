// src/components/explore/note-detail-modal.tsx (Yangi so'rovlar bo'yicha to'liq optimallashgan versiya)

"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { toast } from 'react-hot-toast';

// --- UI Komponentlar ---
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { X, Heart, MessageCircle, Clock, Send, Loader2, Trash2, User, Eye } from "lucide-react";

// --- Service va Hookslar ---
import type { Note } from '@/services/notes-service';
import type { Comment } from '@/services/note-interactions-service';
import { useGetComments, useAddComment, useDeleteComment, useToggleLike } from '@/hooks/use-note-interactions';
import { useMyProfile } from '@/hooks/use-profile';
import { Profile } from '@/types';

// --- Utilities (uncha o'zgarish yo'q) ---
const getInitials = (profile: Profile | null | undefined) => {
  if (!profile) return "U";
  const initials = (profile.firstName?.charAt(0) || '') + (profile.lastName?.charAt(0) || '');
  if (initials) return initials.toUpperCase();
  if (profile.username) return profile.username.slice(0, 2).toUpperCase();
  return "U";
};

const formatDate = (date: string | Date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Noma'lum sana";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const HtmlContent = React.memo(({ html }: { html: string }) => {
  return (
    <div
      className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-300 [&>p]:leading-relaxed [&>h1]:text-2xl [&>h2]:text-xl [&>h3]:text-lg"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});
HtmlContent.displayName = "HtmlContent";


// --- Comment Component (Yangi Kirish Animatsiyasi) ---
interface CommentItemProps {
  comment: Comment;
  currentProfileId?: number;
  onDelete: (commentId: number, noteId: number) => void;
  isDeleting: boolean;
}

const commentItemVariants: Variants = {
  // Pastdan silliq sirg'alib kirish uchun optimallashtirildi
  initial: { opacity: 0, y: 30, height: 0, paddingBottom: 0 },
  animate: {
    opacity: 1,
    y: 0,
    height: "auto",
    paddingBottom: "12px", // py-3 (padding y uchun 12px)
    transition: { type: "spring", stiffness: 200, damping: 30, duration: 0.4 }
  },
  // O'chirish (sirg'alib chiqish) animatsiyasi
  exit: {
    opacity: 0,
    height: 0,
    paddingTop: 0,
    paddingBottom: 0,
    transition: { duration: 0.3 }
  },
};

const CommentItem = React.memo(({ comment, currentProfileId, onDelete, isDeleting }: CommentItemProps) => {
  const author = comment.author;
  const isMyComment = author?.id === currentProfileId;
  const isPendingDelete = isDeleting;

  return (
    <motion.div
      variants={commentItemVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      // py-3 dan padding-y ni olib tashladik, chunki u animatsiyada boshqariladi
      className={`flex gap-3 pt-3 ${isPendingDelete ? 'opacity-50 pointer-events-none' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/80'} transition-all duration-300 rounded-lg overflow-hidden`}
    >
      <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
        <AvatarImage src={author?.avatar || undefined} />
        <AvatarFallback className="bg-violet-600/10 text-violet-600 dark:bg-violet-900/30 text-sm font-semibold">{getInitials(author)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
            {author?.username || "Noma'lum foydalanuvchi"}
            {isMyComment && (
              <span className="ml-2 text-[10px] font-medium text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Siz</span>
            )}
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-500 ml-auto flex items-center">
            {formatDate(comment.createdAt)}
            {isMyComment && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onDelete(comment.id, comment.noteId)}
                className="ml-2 p-1 text-slate-400 hover:text-red-500 transition-colors rounded-full"
                aria-label="Izohni o'chirish"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            )}
          </span>
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{comment.text}</p>
      </div>
    </motion.div>
  );
});
CommentItem.displayName = "CommentItem";


// --- NoteDetailModal Component ---
interface NoteDetailModalProps {
  note: Note;
  isOpen: boolean;
  onClose: () => void;
  currentProfileId?: number;
  onToggleLike: (noteId: number) => void;
}

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } },
};

export const NoteDetailModal: React.FC<NoteDetailModalProps> = ({
  note,
  isOpen,
  onClose,
  currentProfileId,
  onToggleLike
}) => {
  const [commentText, setCommentText] = useState('');
  const commentsListRef = useRef<HTMLDivElement>(null);

  // --- TanStack Query Hookslari ---
  const { data: profileData } = useMyProfile();
  const myProfile = profileData?.profile;

  const {
    data: comments = [],
    isLoading: isCommentsLoading,
  } = useGetComments(note.id);

  const addCommentMutation = useAddComment();
  const deleteCommentMutation = useDeleteComment();
  const toggleLikeMutation = useToggleLike(note.id);

  // --- Mantiq ---
  const isLiked = note.likes?.some(like => like.profileId === currentProfileId) || false;

  // Izoh qo'shilganda ro'yxatni pastga skroll qilish (Yangi animatsiya bilan ishlashi uchun to'g'rilandi)
  useEffect(() => {
    if (addCommentMutation.isSuccess && commentsListRef.current) {
      // Animatsiya tugashini kutish
      setTimeout(() => {
        if (commentsListRef.current) {
          commentsListRef.current.scrollTop = commentsListRef.current.scrollHeight;
        }
      }, 450); // Animatsiya davomiyligidan biroz ko'proq (400ms + 50ms bufer)
    }
  }, [addCommentMutation.isSuccess]);


  // Izoh qo'shish
  const handleAddComment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfileId) {
      toast.error("Izoh qoldirish uchun tizimga kiring.");
      return;
    }
    const text = commentText.trim();
    if (!text) {
      toast.error("Izoh matnini kiriting.");
      return;
    }

    addCommentMutation.mutate({ noteId: note.id, text }, {
      onSuccess: () => {
        setCommentText('');
        toast.success("Izoh muvaffaqiyatli qo'shildi! 💬");
      },
      onError: (error) => {
        toast.error(`Izoh qo'shishda xato: ${error instanceof Error ? error.message : "Noma'lum xato"}`);
      }
    });
  }, [commentText, currentProfileId, addCommentMutation, note.id]);

  // Izohni o'chirish
  const handleDeleteComment = useCallback((commentId: number, noteId: number) => {
    deleteCommentMutation.mutate({ commentId, noteId }, {
      onSuccess: () => {
        toast.success("Izoh o'chirildi. 🗑️");
      },
      onError: (error) => {
        toast.error(`O'chirishda xato: ${error instanceof Error ? error.message : "Noma'lum xato"}`);
      }
    });
  }, [deleteCommentMutation]);


  // --- RENDER QISMI ---

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          // Kenglik 950px ga oshirildi
          className="p-0 sm:max-w-[950px] max-h-[90vh] grid grid-cols-1 md:grid-cols-5 gap-0 overflow-hidden rounded-xl"
          initial="hidden"
          animate="visible"
          variants={modalVariants}
        >
          {/* 1. Kontent qismi (3/5 qism - Skroll bo'luvchi asosiy qism) */}
          <div className="md:col-span-3 flex flex-col p-6 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">

            {/* Muallif ma'lumotlari va Yopish tugmasi */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-200 dark:border-slate-800 mb-4 sticky top-0 bg-white dark:bg-slate-900 z-10">
              {/* Muallif ma'lumotlari */}
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={note.profile?.avatar || undefined} />
                  <AvatarFallback className="bg-violet-600 dark:bg-violet-700 text-white font-bold">{getInitials(note.profile)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-violet-600 dark:text-violet-400 leading-none">
                    {note.profile?.username || "Noma'lum muallif"}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {formatDate(note.createdAt)}
                  </p>
                </div>
              </div>

              {/* Ikkita yopish tugmasi muammosi hal etilgan: bu yerda mobil uchun, asosiy modalda desktop uchun */}
              <motion.button
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.8 }}
                onClick={onClose}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0 md:hidden"
                aria-label="Modalni yopish"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Eslatma Sarlavhasi */}
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              {note.title}
            </h2>

            {/* Eslatma Mazmuni */}
            <div className="flex-1 pr-2">
              <HtmlContent html={note.content} />
            </div>

          </div>

          {/* 2. Interaksiya va Izohlar Qismi (2/5 qism - O'ng panel) */}
          <div className="md:col-span-2 flex flex-col bg-slate-50 dark:bg-slate-800">

            {/* Statistika Bloki (Qotirilgan Yuqori qism) */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-around items-center gap-4 flex-shrink-0">
              <motion.button
                onClick={(e) => { e.stopPropagation(); onToggleLike(note.id); }}
                className={`flex items-center gap-2 text-sm font-bold transition-colors rounded-lg px-3 py-1.5 ${isLiked ? "text-red-500 bg-red-500/10" : "text-slate-500 hover:text-red-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                whileTap={{ scale: 0.95 }}
                disabled={toggleLikeMutation.isPending}
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-red-500" : ""}`} />
                {toggleLikeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : note.likesCount} Layk
              </motion.button>
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                <MessageCircle className="w-5 h-5 text-violet-500" /> {note.commentsCount} Izoh
              </span>
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                <Eye className="w-5 h-5 text-blue-500" /> {note.viewsCount} Ko'rish
              </span>
            </div>

            {/* Izohlar Ro'yxati (SKROLL BO'LUVCHI O'RTA QISM) */}
            <div ref={commentsListRef} className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar min-h-[150px]">
              <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100 pb-2 sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
                Izohlar ({comments.length})
              </h4>

              {isCommentsLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex gap-3 py-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1 w-full">
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))
              ) : comments.length > 0 ? (
                <AnimatePresence initial={false}>
                  {comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      currentProfileId={currentProfileId}
                      onDelete={handleDeleteComment}
                      isDeleting={deleteCommentMutation.isPending}
                    />
                  ))}
                </AnimatePresence>
              ) : (
                <div className="text-sm text-center text-slate-500 dark:text-slate-400 py-6 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg m-2">
                  <MessageCircle className="w-6 h-6 mx-auto mb-2" />
                  <p>Hali izohlar yo'q. Birinchi bo'lib qoldiring!</p>
                </div>
              )}
            </div>

            {/* Izoh Qoldirish shakli (QOTIRILGAN PASTKI QISM - YONMA-YON TARTIB) */}
            <form onSubmit={handleAddComment} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-start gap-3 flex-shrink-0">

              {myProfile ? (
                <Avatar className="h-10 w-10 flex-shrink-0 mt-1">
                  <AvatarImage src={myProfile.avatar || undefined} />
                  <AvatarFallback className="bg-violet-600 text-white font-bold">{getInitials(myProfile)}</AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-10 w-10 flex-shrink-0 mt-1 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-slate-500" />
                </div>
              )}

              {/* TEXTAREA VA BUTTON YONMA-YON JOYLASHTIRILDI */}
              <div className="flex-1 flex gap-2 items-end">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={currentProfileId ? "Izohingizni yozing..." : "Izoh qoldirish uchun tizimga kiring."}
                  disabled={!currentProfileId || addCommentMutation.isPending}
                  className="resize-none h-10 min-h-[40px] text-sm dark:bg-slate-800 dark:border-slate-700 focus:border-violet-500 w-full pt-2"
                />
                <Button
                  type="submit"
                  size="icon" // Ixcham tugma uchun icon size
                  className="h-10 w-10 bg-violet-600 hover:bg-violet-700 flex-shrink-0" // Input balandligiga moslashtirildi
                  disabled={!currentProfileId || addCommentMutation.isPending || !commentText.trim()}
                >
                  {addCommentMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </form>
          </div>

        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};