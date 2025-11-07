"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { X, Heart, MessageCircle, Clock, Send, Loader2, Trash2, User, Eye } from "lucide-react";

import type { Note } from "@/services/notes-service";
import type { Comment } from "@/services/note-interactions-service";
import { useGetComments, useAddComment, useDeleteComment, useToggleLike } from "@/hooks/use-note-interactions";
import { useMyProfile } from "@/hooks/use-profile";
import { Profile } from "@/types";
import "highlight.js/styles/github-dark.css";

// -----------------------------------------------------------------------------
// Yordamchi funksiyalar
// -----------------------------------------------------------------------------
const getInitials = (profile: Profile | null | undefined) => {
  if (!profile) return "U";
  const initials = (profile.firstName?.charAt(0) || "") + (profile.lastName?.charAt(0) || "");
  if (initials) return initials.toUpperCase();
  if (profile.username) return profile.username.slice(0, 2).toUpperCase();
  return "U";
};

const formatDate = (date: string | Date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Noma'lum sana";
  return d.toLocaleDateString("uz-UZ", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

function decodeHtmlEntities(html: string) {
  if (typeof document === "undefined") return html;
  const textarea = document.createElement("textarea");
  textarea.innerHTML = html;
  return textarea.value;
}

// -----------------------------------------------------------------------------
// HtmlContent
// -----------------------------------------------------------------------------
const HtmlContent = React.memo(({ html }: { html: string }) => {
  const decoded = decodeHtmlEntities(html);
  return (
    <div
      className="prose overflow-y-auto max-h-[60vh] md:max-h-none dark:prose-invert max-w-none text-slate-800 dark:text-slate-200
                 [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:rounded-lg [&_pre]:p-3 custom-scrollbar"
      dangerouslySetInnerHTML={{ __html: decoded }}
    />
  );
});
HtmlContent.displayName = "HtmlContent";

// -----------------------------------------------------------------------------
// CommentItem
// -----------------------------------------------------------------------------
interface CommentItemProps {
  comment: Comment;
  currentProfileId?: number;
  onDelete: (commentId: number, noteId: number) => void;
  isDeleting: boolean;
}

const commentItemVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const CommentItem = React.memo(({ comment, currentProfileId, onDelete, isDeleting }: CommentItemProps) => {
  const author = comment.author;
  const isMyComment = author?.id === currentProfileId;

  return (
    <motion.div
      layout
      variants={commentItemVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`flex gap-3 py-3 px-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0
                  ${isDeleting ? "opacity-50 pointer-events-none" : "hover:bg-slate-50 dark:hover:bg-slate-800"}
                  transition-all duration-200 rounded-lg`}
    >
      <Avatar className="h-9 w-9 flex-shrink-0">
        <AvatarImage src={author?.avatar || undefined} />
        <AvatarFallback className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 text-sm font-medium">
          {getInitials(author)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {author?.username || "Noma'lum"}
            </p>
            {isMyComment && (
              <span className="text-xs text-violet-500 bg-violet-100 dark:bg-violet-900/50 px-2 py-0.5 rounded-full">
                Siz
              </span>
            )}
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {formatDate(comment.createdAt)}
            </span>
          </div>
          {isMyComment && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onDelete(comment.id, comment.noteId)}
              className="p-1 text-slate-400 hover:text-red-500 transition-colors rounded-full"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          )}
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap break-words">
          {comment.text}
        </p>
      </div>
    </motion.div>
  );
});
CommentItem.displayName = "CommentItem";

// -----------------------------------------------------------------------------
// Animatsiya variantlari
// -----------------------------------------------------------------------------
const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: -50 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 20 } },
  exit: { opacity: 0, scale: 0.95, y: -50, transition: { duration: 0.2 } },
};

const mobileModalVariants: Variants = {
  hidden: { y: "100%" },
  visible: { y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  exit: { y: "100%", transition: { duration: 0.25 } },
};

// -----------------------------------------------------------------------------
// Asosiy komponent
// -----------------------------------------------------------------------------
interface NoteDetailModalProps {
  note: Note;
  isOpen: boolean;
  onClose: () => void;
  currentProfileId?: number;
  onToggleLike: (noteId: number) => void;
}

export const NoteDetailModal: React.FC<NoteDetailModalProps> = ({
  note,
  isOpen,
  onClose,
  currentProfileId,
  onToggleLike,
}) => {
  const [commentText, setCommentText] = useState("");
  const [isCommentsSheetOpen, setIsCommentsSheetOpen] = useState(false);
  const commentsListRef = useRef<HTMLDivElement>(null);

  const { data: profileData } = useMyProfile();
  const myProfile = profileData?.profile;

  const { data: comments = [], isLoading: isCommentsLoading, refetch } = useGetComments(note?.id);
  const addCommentMutation = useAddComment();
  const deleteCommentMutation = useDeleteComment();
  const toggleLikeMutation = useToggleLike(note?.id);

  const isLiked = note?.likes?.some((like) => like.profile?.id === currentProfileId) || false;

  // Scroll to bottom when new comment added
  useEffect(() => {
    if (addCommentMutation.isSuccess && commentsListRef.current) {
      setTimeout(() => {
        commentsListRef.current?.scrollTo({ top: commentsListRef.current.scrollHeight, behavior: "smooth" });
      }, 100);
    }
  }, [addCommentMutation.isSuccess]);

  const handleAddComment = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentProfileId) {
        toast.error("Izoh qoldirish uchun tizimga kiring.", { position: "bottom-center" });
        return;
      }
      const text = commentText.trim();
      if (!text) {
        toast.error("Izoh matnini kiriting.");
        return;
      }

      addCommentMutation.mutate(
        { noteId: note?.id, text },
        {
          onSuccess: () => {
            setCommentText("");
            toast.success("Izoh qo'shildi!", { position: "bottom-center" });
            refetch();
          },
          onError: () => toast.error("Xato yuz berdi."),
        }
      );
    },
    [commentText, currentProfileId, addCommentMutation, note?.id, refetch]
  );

  const handleDeleteComment = useCallback(
    (commentId: number, noteId: number) => {
      deleteCommentMutation.mutate(
        { commentId, noteId },
        {
          onSuccess: () => {
            toast.success("Izoh o'chirildi!");
            refetch();
          },
          onError: () => toast.error("O'chirishda xato."),
        }
      );
    },
    [deleteCommentMutation, refetch]
  );

  const handleToggleLike = useCallback(() => {
    onToggleLike(note?.id);
  }, [note?.id, onToggleLike]);

  return (
    <TooltipProvider>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-[1000]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            {/* Desktop Modal */}
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="hidden md:block fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                         w-[95vw] max-w-[900px] max-h-[90vh] bg-white dark:bg-slate-900
                         rounded-xl shadow-2xl overflow-hidden z-[1001]"
            >
              <div className="grid grid-cols-1 md:grid-cols-5 h-full">
                {/* Note Content */}
                <div className="md:col-span-3 flex flex-col p-6 overflow-hidden bg-white dark:bg-slate-900 md:border-r border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={note?.profile?.avatar} />
                        <AvatarFallback className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300">
                          {getInitials(note?.profile)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-violet-600 dark:text-violet-400">{note?.profile?.username}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDate(note?.createdAt)}
                        </p>
                      </div>
                    </div>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={onClose} className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-full">
                      <X className="w-5 h-5" />
                    </motion.button>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">{note?.title}</h2>
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <HtmlContent html={note?.content} />
                  </div>
                </div>

                {/* Comments Sidebar */}
                <div className="md:col-span-2 overflow-scroll max-h-[80vh] flex flex-col bg-slate-50 dark:bg-slate-800">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Izohlar</h3>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{comments.length}</span>
                  </div>
                  <div className="flex justify-around py-3 border-b border-slate-200 dark:border-slate-700">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.button
                          onClick={handleToggleLike}
                          disabled={toggleLikeMutation.isPending}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${isLiked ? "text-red-500 bg-red-100 dark:bg-red-900/50" : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                            }`}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Heart className={`w-5 h-5 ${isLiked ? "fill-red-500" : ""}`} />
                          {note?.likes?.length || 0}
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent>Layk</TooltipContent>
                    </Tooltip>
                    <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Eye className="w-5 h-5 text-blue-500" /> {note?.views?.length || 0}
                    </span>
                  </div>
                  <div ref={commentsListRef} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {isCommentsLoading ? (
                      Array(3).fill(0).map((_, i) => (
                        <div key={i} className="flex gap-3">
                          <Skeleton className="h-9 w-9 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-3 w-3/4" />
                          </div>
                        </div>
                      ))
                    ) : comments.length > 0 ? (
                      <AnimatePresence initial={false}>
                        {comments.map((c) => (
                          <CommentItem
                            key={c.id}
                            comment={c}
                            currentProfileId={currentProfileId}
                            onDelete={handleDeleteComment}
                            isDeleting={deleteCommentMutation.isPending}
                          />
                        ))}
                      </AnimatePresence>
                    ) : (
                      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <MessageCircle className="w-8 h-8 mx-auto mb-2 text-violet-500" />
                        <p className="text-sm">Hali izoh yo'q</p>
                      </div>
                    )}
                  </div>
                  <form onSubmit={handleAddComment} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={myProfile?.avatar} />
                      <AvatarFallback className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 text-sm">
                        {getInitials(myProfile)}
                      </AvatarFallback>
                    </Avatar>
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={currentProfileId ? "Izoh..." : "Kirish kerak"}
                      disabled={!currentProfileId || addCommentMutation.isPending}
                      className="resize-none min-h-[40px] text-sm bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-violet-500 rounded-lg"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!commentText.trim() || addCommentMutation.isPending || !currentProfileId}
                      className="h-9 w-9 bg-violet-600 hover:bg-violet-700 rounded-full"
                    >
                      {addCommentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </form>
                </div>
              </div>
            </motion.div>

            {/* Mobile Fullscreen Modal */}
            <motion.div
              variants={mobileModalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="md:hidden fixed bottom-0 left-0 right-0 w-full h-[90vh] bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl flex flex-col z-[1001] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={note?.profile?.avatar} />
                    <AvatarFallback className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 text-xs">
                      {getInitials(note?.profile)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{note?.profile?.username}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(note?.createdAt)}</p>
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={onClose} className="p-2 text-slate-500 hover:text-slate-700 rounded-full">
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Title */}
              <h2 className="px-4 pt-3 text-xl font-bold text-slate-900 dark:text-slate-50">{note?.title}</h2>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <HtmlContent html={note?.content} />
              </div>

              {/* Bottom Actions */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-around items-center bg-white dark:bg-slate-900">
                <motion.button
                  onClick={handleToggleLike}
                  disabled={toggleLikeMutation.isPending}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${isLiked ? "text-red-500 bg-red-100 dark:bg-red-900/50" : "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800"
                    }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? "fill-red-500" : ""}`} />
                  {note?.likes?.length || 0}
                </motion.button>
                <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Eye className="w-5 h-5 text-blue-500" /> {note?.views?.length || 0}
                </span>
                <Button
                  onClick={() => setIsCommentsSheetOpen(true)}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-full h-9 px-4"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {comments.length}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Comments Bottom Sheet */}
      <AnimatePresence>
        {isCommentsSheetOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-[1002] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCommentsSheetOpen(false)}
          >
            <motion.div
              variants={mobileModalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 h-[85vh] bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-center p-3 border-b border-slate-200 dark:border-slate-700 relative">
                <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                <h4 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold">Izohlar ({comments.length})</h4>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsCommentsSheetOpen(false)}
                  className="absolute right-3 p-2 text-slate-500 hover:text-slate-700 rounded-full"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
              <div ref={commentsListRef} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {isCommentsLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                  ))
                ) : comments.length > 0 ? (
                  <AnimatePresence initial={false}>
                    {comments.map((c) => (
                      <CommentItem
                        key={c.id}
                        comment={c}
                        currentProfileId={currentProfileId}
                        onDelete={handleDeleteComment}
                        isDeleting={deleteCommentMutation.isPending}
                      />
                    ))}
                  </AnimatePresence>
                ) : (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <MessageCircle className="w-8 h-8 mx-auto mb-3 text-violet-500" />
                    <p className="text-sm">Hali izohlar yo'q</p>
                  </div>
                )}
              </div>
              <form onSubmit={handleAddComment} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={myProfile?.avatar} />
                  <AvatarFallback className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 text-sm">
                    {getInitials(myProfile)}
                  </AvatarFallback>
                </Avatar>
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={currentProfileId ? "Izoh..." : "Kirish kerak"}
                  disabled={!currentProfileId || addCommentMutation.isPending}
                  className="resize-none min-h-[40px] text-sm bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-violet-500 rounded-lg"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!commentText.trim() || addCommentMutation.isPending || !currentProfileId}
                  className="h-9 w-9 bg-violet-600 hover:bg-violet-700 rounded-full"
                >
                  {addCommentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
};