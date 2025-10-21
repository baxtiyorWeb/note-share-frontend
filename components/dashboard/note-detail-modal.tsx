// src/components/dashboard/note-detail-modal.tsx (To'liq yangilangan fayl)

"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { toast } from 'react-hot-toast';

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";

import { X, Heart, MessageCircle, Clock, Send, Loader2, Trash2, User, Eye } from "lucide-react";

import type { Note } from '@/services/notes-service';
import type { Comment } from '@/services/note-interactions-service';
import { useGetComments, useAddComment, useDeleteComment, useToggleLike } from '@/hooks/use-note-interactions';
import { useMyProfile } from '@/hooks/use-profile';
import { Profile } from '@/types';


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


interface CommentItemProps {
  comment: Comment;
  currentProfileId?: number;
  onDelete: (commentId: number, noteId: number) => void;
  isDeleting: boolean;
}
interface NoteDetailModalProps {
  note: Note;
  isOpen: boolean;
  onClose: () => void;
  currentProfileId?: number;
  onToggleLike: (noteId: number) => void;
}
const commentItemVariants: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ease: [0.25, 0.1, 0.25, 1],
      duration: 0.25,
    },
  },
  exit: {
    opacity: 0,
    y: 25,
    scale: 0.9,
    filter: "blur(2px)",
    transition: {
      ease: [0.4, 0, 0.2, 1],
      duration: 0.25,
    },
  },
};
const CommentItem = React.memo(({ comment, currentProfileId, onDelete, isDeleting }: CommentItemProps) => {
  const author = comment.author;
  const isMyComment = author?.id === currentProfileId;
  const isPendingDelete = isDeleting;

  return (
    <motion.div
      layout
      variants={commentItemVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`flex gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0 ${isPendingDelete ? 'opacity-50 pointer-events-none' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/80'
        } transition-all duration-300 rounded-lg overflow-hidden`}
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
const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } },
};


interface CommentsMobileModalProps {
  note: Note;
  isOpen: boolean;
  onClose: () => void;
  currentProfileId?: number;
  myProfile: Profile | null | undefined;
  comments: Comment[];
  isCommentsLoading: boolean;
  handleDeleteComment: (commentId: number, noteId: number) => void;
  handleAddComment: (e: React.FormEvent) => Promise<void>;
  commentText: string;
  setCommentText: (text: string) => void;
  addCommentMutation: any;
  deleteCommentMutation: any;
}

const modalMobileVariants: Variants = {
  hidden: { opacity: 0, y: "100%" },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, type: "tween" } },
  exit: { opacity: 0, y: "100%", transition: { duration: 0.2, type: "tween" } },
};

const CommentsMobileModal: React.FC<CommentsMobileModalProps> = ({
  note,
  isOpen,
  onClose,
  currentProfileId,
  myProfile,
  comments,
  isCommentsLoading,
  handleDeleteComment,
  handleAddComment,
  commentText,
  setCommentText,
  addCommentMutation,
  deleteCommentMutation,
}) => {
  const commentsListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (addCommentMutation.isSuccess && commentsListRef.current) {
      setTimeout(() => {
        if (commentsListRef.current) {
          commentsListRef.current.scrollTop = commentsListRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [addCommentMutation.isSuccess]);


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
              className="p-0 max-w-full w-full h-[95vh] rounded-t-2xl pointer-events-auto bg-slate-50 dark:bg-slate-900 flex flex-col"
            >
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={modalMobileVariants}
                className="flex flex-col h-full"
              >
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-violet-600" />
                    Izohlar ({comments.length})
                  </h4>

                </div>

                <div ref={commentsListRef} className="flex-1 overflow-y-scroll p-4 space-y-2 custom-scrollbar">
                  {isCommentsLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <div key={i} className="flex gap-3 py-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1 w-full">
                          <Skeleton className="h-3 w-2/3" />
                          <Skeleton className="h-3 w-full" />
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
                    <div className="text-sm text-center text-slate-500 dark:text-slate-400 py-12">
                      <MessageCircle className="w-8 h-8 mx-auto mb-3" />
                      <p>Hali izohlar yo'q. Birinchi bo'lib qoldiring!</p>
                    </div>
                  )}
                </div>

                <form onSubmit={handleAddComment} className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-start gap-2 flex-shrink-0">
                  {myProfile && (
                    <Avatar className="h-9 w-9 flex-shrink-0 mt-1">
                      <AvatarImage src={myProfile.avatar || undefined} />
                      <AvatarFallback className="bg-violet-600 text-white font-bold text-sm">{getInitials(myProfile)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex-1 flex gap-2 items-end">
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={currentProfileId ? "Izohingizni yozing..." : "Izoh qoldirish uchun tizimga kiring."}
                      disabled={!currentProfileId || addCommentMutation.isPending}
                      className="resize-none h-10 min-h-[40px] text-sm dark:bg-slate-700 dark:border-slate-600 focus:border-violet-500 w-full pt-2"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="h-10 w-10 bg-violet-600 hover:bg-violet-700 flex-shrink-0"
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
              </motion.div>
            </DialogContent>
          </Dialog>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


// --- NOTE DETAIL MODAL ASOSIY KOMPONENTI ---

export const NoteDetailModal: React.FC<NoteDetailModalProps> = ({
  note,
  isOpen,
  onClose,
  currentProfileId,
  onToggleLike
}) => {
  const [commentText, setCommentText] = useState('');
  // Mobil uchun alohida modal holati
  const [isCommentsMobileOpen, setIsCommentsMobileOpen] = useState(false);
  const commentsListRef = useRef<HTMLDivElement>(null);

  const { data: profileData } = useMyProfile();
  const myProfile = profileData?.profile;

  const {
    data: comments = [],
    isLoading: isCommentsLoading,
    refetch
  } = useGetComments(note.id);

  const addCommentMutation = useAddComment();
  const deleteCommentMutation = useDeleteComment();
  const toggleLikeMutation = useToggleLike(note.id);

  const isLiked = note.likes?.some(like => like.profile?.id === currentProfileId) || false;

  // Faqat Desktop qismi uchun skroll effektini saqlaymiz
  useEffect(() => {
    if (addCommentMutation.isSuccess && commentsListRef.current) {
      setTimeout(() => {
        if (commentsListRef.current) {
          commentsListRef.current.scrollTop = commentsListRef.current.scrollHeight;
        }
      }, 450);
    }
  }, [addCommentMutation.isSuccess]);


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
        refetch()
      },
      onError: (error) => {
        toast.error(`Izoh qo'shishda xato: ${error instanceof Error ? error.message : "Noma'lum xato"}`);
      }
    });
  }, [commentText, currentProfileId, addCommentMutation, note.id, refetch]); // refetch qo'shildi

  const handleDeleteComment = useCallback((commentId: number, noteId: number) => {
    deleteCommentMutation.mutate({ commentId, noteId }, {
      onSuccess: () => {
        toast.success("Izoh o'chirildi. 🗑️");
        refetch()
      },
      onError: (error) => {
        toast.error(`O'chirishda xato: ${error instanceof Error ? error.message : "Noma'lum xato"}`);
      }
    });
  }, [deleteCommentMutation, refetch]);


  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="p-1 sm:max-w-[950px] max-h-[90vh] overflow-hidden rounded-xl">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-5 gap-0 h-full"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="md:col-span-3 col-span-5 flex flex-col p-6 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 md:border-r border-slate-200 dark:border-slate-800">

              <div className="flex justify-between items-start pb-4 border-b border-slate-200 dark:border-slate-800 mb-4 sticky top-0 bg-white dark:bg-slate-900 z-10">
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


              </div>

              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
                {note.title}
              </h2>

              <div className="flex-1 pr-2">
                <HtmlContent html={note.content} />
              </div>

              <div className="md:hidden flex flex-col gap-3 p-4 bg-white dark:bg-slate-900 sticky bottom-0 border-t border-slate-200 dark:border-slate-800 mt-4 -mx-6">
                <div className="flex justify-around items-center gap-4">
                  <motion.button
                    onClick={(e) => { e.stopPropagation(); onToggleLike(note.id); }}
                    className={`flex items-center gap-2 text-sm font-bold transition-colors rounded-lg px-3 py-1.5 ${isLiked ? "text-red-500 bg-red-500/10" : "text-slate-500 hover:text-red-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                    whileTap={{ scale: 0.95 }}
                    disabled={toggleLikeMutation.isPending}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? "fill-red-500" : ""}`} />
                    {toggleLikeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : note?.likes?.length}
                  </motion.button>
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                    <Eye className="w-5 h-5 text-blue-500" /> {note?.views?.length}
                  </span>
                </div>
                <Button
                  onClick={() => setIsCommentsMobileOpen(true)}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Izohlarni ko'rish ({comments.length})
                </Button>
              </div>

            </div>

            <div className="hidden md:col-span-2 md:flex flex-col bg-slate-50 dark:bg-slate-800">

              {/* Statistika Bloki (Qotirilgan Yuqori qism) */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-around items-center gap-4 flex-shrink-0">
                <motion.button
                  onClick={(e) => { e.stopPropagation(); onToggleLike(note.id); }}
                  className={`flex items-center gap-2 text-sm font-bold transition-colors rounded-lg px-3 py-1.5 ${isLiked ? "text-red-500 bg-red-500/10" : "text-slate-500 hover:text-red-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                  whileTap={{ scale: 0.95 }}
                  disabled={toggleLikeMutation.isPending}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? "fill-red-500" : ""}`} />
                  {toggleLikeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : note?.likes?.length} Layk
                </motion.button>
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <MessageCircle className="w-5 h-5 text-violet-500" /> {comments.length} Izoh
                </span>
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <Eye className="w-5 h-5 text-blue-500" /> {note?.views?.length} Ko'rish
                </span>
              </div>
              <h4 className="px-4 my-2 text-base font-extrabold text-slate-900 dark:text-slate-100 pb-2 sticky top-0 bg-slate-50 dark:bg-slate-800 z-10">
                Izohlar ({comments.length})
              </h4>
              <div ref={commentsListRef} className="flex-1 overflow-y-scroll max-h-[400px] p-4 space-y-2 custom-scrollbar min-h-[150px]">


                {isCommentsLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex gap-3 py-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1 w-full">
                        <Skeleton className="h-3 w-2/3" />
                        <Skeleton className="h-3 w-full" />
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

              {/* Izoh Qoldirish shakli (DESKTOP QOTIRILGAN PASTKI QISM) */}
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
                    size="icon"
                    className="h-10 w-10 bg-violet-600 hover:bg-violet-700 flex-shrink-0"
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
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* 3. Mobil Izohlar Modali (Faol Mobile Chat qismi) */}
      <CommentsMobileModal
        note={note}
        isOpen={isCommentsMobileOpen}
        onClose={() => setIsCommentsMobileOpen(false)}
        currentProfileId={currentProfileId}
        myProfile={myProfile}
        comments={comments}
        isCommentsLoading={isCommentsLoading}
        handleDeleteComment={handleDeleteComment}
        handleAddComment={handleAddComment}
        commentText={commentText}
        setCommentText={setCommentText}
        addCommentMutation={addCommentMutation}
        deleteCommentMutation={deleteCommentMutation}
      />
    </TooltipProvider>
  );
};