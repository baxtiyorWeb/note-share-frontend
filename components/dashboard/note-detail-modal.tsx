"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { toast } from "react-hot-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { X, Heart, MessageCircle, Clock, Send, Loader2, Trash2, User, Eye, Menu } from "lucide-react";
import type { Note } from "@/services/notes-service";
import type { Comment } from "@/services/note-interactions-service";
import { useGetComments, useAddComment, useDeleteComment, useToggleLike } from "@/hooks/use-note-interactions";
import { useMyProfile } from "@/hooks/use-profile";
import { Profile } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // GitHub-style markdown
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

// -----------------------------------------------------------------------------
// Yordamchi funksiyalar
// -----------------------------------------------------------------------------

/**
 * Profil ma'lumotlaridan bosh harflarni oladi.
 * @param profile Profil obyekti
 * @returns Bosh harflar yoki "U"
 */
const getInitials = (profile: Profile | null | undefined) => {
  if (!profile) return "U";
  const initials = (profile.firstName?.charAt(0) || "") + (profile.lastName?.charAt(0) || "");
  if (initials) return initials.toUpperCase();
  if (profile.username) return profile.username.slice(0, 2).toUpperCase();
  return "U";
};

/**
 * Sanani O'zbekcha formatda (qisqa, soat bilan) formatlaydi.
 * @param date Sana stringi yoki Date obyekti
 * @returns Formatdagi sana stringi
 */
const formatDate = (date: string | Date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Noma'lum sana";
  return d.toLocaleDateString("uz-UZ", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

/**
 * HTML entitilarni dekodlaydi.
 * @param html HTML stringi
 * @returns Dekodlangan string
 */
function decodeHtmlEntities(html: string) {
  const textarea = typeof document !== 'undefined' ? document.createElement("textarea") : { innerHTML: html, value: html };
  if (typeof document !== 'undefined') {
    textarea.innerHTML = html;
    return textarea.value;
  }
  return html; // Server-side rendering uchun oddiy qaytarish
}

// -----------------------------------------------------------------------------
// Komponent: HtmlContent (Eslatmaning HTML kontentini ko'rsatish)
// -----------------------------------------------------------------------------

const HtmlContent = React.memo(({ html }: { html: string }) => {
  const decoded = decodeHtmlEntities(html);

  return (
    <div
      className="prose overflow-y-auto max-h-[60vh] md:max-h-[calc(90vh-200px)] dark:prose-invert max-w-none text-slate-800 dark:text-slate-200
                 [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:rounded-lg [&_pre]:p-3 custom-scrollbar"
      dangerouslySetInnerHTML={{ __html: decoded }}
    />
  );
});
HtmlContent.displayName = "HtmlContent";

// -----------------------------------------------------------------------------
// Komponent: CommentItem (Har bir izohni ko'rsatish)
// -----------------------------------------------------------------------------

interface CommentItemProps {
  comment: Comment;
  currentProfileId?: number;
  onDelete: (commentId: number, noteId: number) => void;
  isDeleting: boolean;
}

const commentItemVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: 10, transition: { duration: 0.2, ease: "easeIn" } },
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
      className={`flex gap-3 py-3 px-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0
                  ${isPendingDelete ? "opacity-50 pointer-events-none" : "hover:bg-slate-50 dark:hover:bg-slate-800"}
                  transition-all duration-200 rounded-lg`}
    >
      <Avatar className="h-9 w-9 flex-shrink-0">
        <AvatarImage src={author?.avatar || undefined} alt={author?.username || "Foydalanuvchi avatar"} />
        <AvatarFallback className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 text-sm font-medium">
          {getInitials(author)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {author?.username || "Noma'lum foydalanuvchi"}
            </p>
            {isMyComment && (
              <span className="text-xs text-violet-500 bg-violet-100 dark:bg-violet-900/50 px-2 py-0.5 rounded-full flex-shrink-0 w-min">
                Siz
              </span>
            )}
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-0 flex-shrink-0">
              {formatDate(comment.createdAt)}
            </span>
          </div>
          {isMyComment && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onDelete(comment.id, comment.noteId)}
              className="p-1 text-slate-400 hover:text-red-500 transition-colors rounded-full flex-shrink-0"
              aria-label="Izohni o'chirish"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          )}
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap break-words">{comment.text}</p>
      </div>
    </motion.div>
  );
});
CommentItem.displayName = "CommentItem";

// -----------------------------------------------------------------------------
// Mobil Modal Variantlari
// -----------------------------------------------------------------------------

const modalMobileVariants: Variants = {
  hidden: { opacity: 0, y: "100%" },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  exit: { opacity: 0, y: "100%", transition: { duration: 0.25, ease: "easeIn" } },
};

// -----------------------------------------------------------------------------
// Komponent: CommentsMobileModal (Mobil qurilmalar uchun izohlar)
// -----------------------------------------------------------------------------

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

const CommentsMobileModal: React.FC<CommentsMobileModalProps> = React.memo(({
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

  // Yangi izoh qo'shilganda ro'yxatni pastga surish
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
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Dialog open={isOpen} onOpenChange={onClose}>
            {/* DialogContent ni o'rniga to'liq ekranni qoplaydigan motion.div ishlatamiz */}
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={modalMobileVariants}
              className="fixed bottom-0 left-0 right-0 w-full h-[85vh] rounded-t-3xl bg-white dark:bg-slate-900 flex flex-col shadow-2xl z-[101]"
            >
              {/* Header: Drag handle va Sarlavha */}
              <div className="flex flex-col items-center p-3 border-b border-slate-200 dark:border-slate-700 relative">
                <div className="w-10 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mb-3" /> {/* Drag handle */}
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-violet-600" />
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Izohlar ({comments.length})
                  </h4>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="absolute right-3 top-3 p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-full"
                  aria-label="Izohlar oynasini yopish"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Comments List */}
              <div
                ref={commentsListRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
              >
                {isCommentsLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="flex gap-3 py-3">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="space-y-2 w-full">
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-3 w-3/4" />
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
                  <div className="text-center text-slate-500 dark:text-slate-400 py-12">
                    <MessageCircle className="w-8 h-8 mx-auto mb-3 text-violet-500" />
                    <p className="text-sm">Hali izohlar yo'q. Birinchi bo'ling!</p>
                  </div>
                )}
              </div>

              {/* Comment Input Form (Fixed at Bottom) */}
              <form
                onSubmit={handleAddComment}
                className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 flex-shrink-0"
              >
                {myProfile ? (
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarImage src={myProfile.avatar || undefined} alt="Sizning avatar" />
                    <AvatarFallback className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 text-sm font-medium">
                      {getInitials(myProfile)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-9 w-9 flex-shrink-0 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-500" />
                  </div>
                )}
                <div className="flex-1 flex items-center gap-2">
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={currentProfileId ? "Izoh qoldiring..." : "Izoh qoldirish uchun tizimga kiring"}
                    disabled={!currentProfileId || addCommentMutation.isPending}
                    className="resize-none min-h-[40px] max-h-[100px] text-sm bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-violet-500 rounded-lg py-2"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-9 w-9 bg-violet-600 hover:bg-violet-700 rounded-full flex-shrink-0"
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
          </Dialog>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
CommentsMobileModal.displayName = "CommentsMobileModal";

// -----------------------------------------------------------------------------
// Asosiy Modal Variantlari (Desktop uchun)
// -----------------------------------------------------------------------------

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 120, damping: 20 } },
};

// -----------------------------------------------------------------------------
// Komponent: NoteDetailModal (Eslatmaning batafsil ko'rinishi)
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
  const [isCommentsMobileOpen, setIsCommentsMobileOpen] = useState(false);
  const commentsListRef = useRef<HTMLDivElement>(null);

  const { data: profileData } = useMyProfile();
  const myProfile = profileData?.profile;

  // Izohlar va Like/Dislike logikasi
  const { data: comments = [], isLoading: isCommentsLoading, refetch } = useGetComments(note?.id);
  const addCommentMutation = useAddComment();
  const deleteCommentMutation = useDeleteComment();
  const toggleLikeMutation = useToggleLike(note?.id);

  const isLiked = note?.likes?.some((like) => like.profile?.id === currentProfileId) || false;

  // Izoh qo'shilganda izohlar ro'yxatini pastga surish
  useEffect(() => {
    if (addCommentMutation.isSuccess && commentsListRef.current) {
      setTimeout(() => {
        if (commentsListRef.current) {
          commentsListRef.current.scrollTop = commentsListRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [addCommentMutation.isSuccess]);

  // Izoh qo'shish funksiyasi
  const handleAddComment = useCallback(
    async (e: React.FormEvent) => {
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

      addCommentMutation.mutate(
        { noteId: note?.id, text },
        {
          onSuccess: () => {
            setCommentText("");
            toast.success("Izoh muvaffaqiyatli qo'shildi! 💬");
            refetch();
          },
          onError: (error) => {
            toast.error(`Izoh qo'shishda xato: ${error instanceof Error ? error.message : "Noma'lum xato"}`);
          },
        }
      );
    },
    [commentText, currentProfileId, addCommentMutation, note?.id, refetch]
  );

  // Izohni o'chirish funksiyasi
  const handleDeleteComment = useCallback(
    (commentId: number, noteId: number) => {
      deleteCommentMutation.mutate(
        { commentId, noteId },
        {
          onSuccess: () => {
            toast.success("Izoh o'chirildi! 🗑️");
            refetch();
          },
          onError: (error) => {
            toast.error(`O'chirishda xato: ${error instanceof Error ? error.message : "Noma'lum xato"}`);
          },
        }
      );
    },
    [deleteCommentMutation, refetch]
  );

  // Layk berish funksiyasi
  const handleToggleLikeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleLike(note?.id);
  }, [note?.id, onToggleLike]);


  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="p-0 max-w-[95vw] rounded-xl sm:max-w-[900px] max-h-[90vh] overflow-hidden">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-5 gap-0 h-full"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {/* -------------------------------------------------- */}
            {/* Eslatma Kontenti Qismi (Asosiy / Katta qism) */}
            {/* -------------------------------------------------- */}
            <div className="md:col-span-3 flex flex-col p-4 sm:p-6 overflow-hidden bg-white dark:bg-slate-900 md:border-r border-slate-200 dark:border-slate-800 h-[90vh] md:h-auto">

              {/* Sarlavha va Muallif ma'lumotlari */}
              <div className="flex flex-col pb-4 border-b border-slate-200 dark:border-slate-800 mb-4 flex-shrink-0 relative">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={note?.profile?.avatar || undefined} alt={note?.profile?.username || "Muallif avatar"} />
                    <AvatarFallback className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 font-medium">
                      {getInitials(note?.profile)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-violet-600 dark:text-violet-400">{note?.profile?.username || "Noma'lum muallif"}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" /> {formatDate(note?.createdAt)}
                    </p>
                  </div>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 mt-4 break-words">{note?.title}</h2>
                {/* Yopish tugmasi (Kichik ekranlarda yuqorida) */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="absolute right-0 top-0 p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-full md:hidden"
                  aria-label="Modalni yopish"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Eslatmaning kontenti */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <HtmlContent html={note?.content} />
              </div>

              {/* Mobil Pastki Panel: Statistikalar va Izohlar Tugmasi */}
              <div className="md:hidden flex flex-col gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 mt-4 flex-shrink-0">
                <div className="flex justify-between items-center px-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        onClick={handleToggleLikeClick}
                        className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full ${isLiked ? "text-red-500 bg-red-100 dark:bg-red-900/50" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        whileTap={{ scale: 0.95 }}
                        disabled={toggleLikeMutation.isPending}
                        aria-label={isLiked ? "Laykni olib tashlash" : "Layk qo'zg'atish"}
                      >
                        <Heart className={`w-5 h-5 ${isLiked ? "fill-red-500" : ""}`} />
                        {toggleLikeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : note?.likes?.length}
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent>Layk</TooltipContent>
                  </Tooltip>

                  <span className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 px-3 py-1.5">
                    <Eye className="w-5 h-5 text-blue-500" /> {note?.views?.length}
                  </span>

                  <Button
                    onClick={() => setIsCommentsMobileOpen(true)}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-full h-9 px-4"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Izohlar ({comments.length})
                  </Button>
                </div>
              </div>
            </div>

            {/* -------------------------------------------------- */}
            {/* Izohlar Qismi (Faqat Desktop uchun) */}
            {/* -------------------------------------------------- */}
            <div className="hidden pt-4 md:flex md:col-span-2 flex-col bg-slate-50 dark:bg-slate-800 rounded-r-xl overflow-hidden">

              {/* Yopish tugmasi (Katta ekranlarda yuqorida) */}
              <div className="flex justify-end p-2 flex-shrink-0">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-full"
                  aria-label="Modalni yopish"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Stats Block */}
              <div className="px-5 pb-4 border-b border-slate-200 dark:border-slate-700 flex justify-around items-center gap-4 flex-shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      onClick={handleToggleLikeClick}
                      className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full ${isLiked ? "text-red-500 bg-red-100 dark:bg-red-900/50" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                      whileTap={{ scale: 0.95 }}
                      disabled={toggleLikeMutation.isPending}
                      aria-label={isLiked ? "Laykni olib tashlash" : "Layk qo'zg'atish"}
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? "fill-red-500" : ""}`} />
                      {toggleLikeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : note?.likes?.length} Layk
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent>Layklar soni</TooltipContent>
                </Tooltip>

                <span className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <MessageCircle className="w-5 h-5 text-violet-500" /> {comments.length} Izoh
                </span>
                <span className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <Eye className="w-5 h-5 text-blue-500" /> {note?.views?.length} Ko'rish
                </span>
              </div>

              {/* Comments List */}
              <div ref={commentsListRef} className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar min-h-0">
                {isCommentsLoading ? (
                  Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="flex gap-3 py-3">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="space-y-2 w-full">
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-3 w-3/4" />
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
                  <div className="text-center text-slate-500 dark:text-slate-400 py-8 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg mx-2">
                    <MessageCircle className="w-6 h-6 mx-auto mb-2 text-violet-500" />
                    <p className="text-sm">Hali izohlar yo'q. Birinchi bo'ling!</p>
                  </div>
                )}
              </div>

              {/* Comment Input Form (Desktop) */}
              <form
                onSubmit={handleAddComment}
                className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center gap-3 flex-shrink-0"
              >
                {myProfile ? (
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarImage src={myProfile.avatar || undefined} alt="Sizning avatar" />
                    <AvatarFallback className="bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300 text-sm font-medium">
                      {getInitials(myProfile)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-9 w-9 flex-shrink-0 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-500" />
                  </div>
                )}
                <div className="flex-1 flex items-center gap-2">
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={currentProfileId ? "Izoh qoldiring..." : "Izoh qoldirish uchun tizimga kiring"}
                    disabled={!currentProfileId || addCommentMutation.isPending}
                    className="resize-none min-h-[40px] max-h-[100px] text-sm bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-violet-500 rounded-lg py-2"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="h-9 w-9 bg-violet-600 hover:bg-violet-700 rounded-full flex-shrink-0"
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

      {/* Mobil Izohlar Modali (CommentsMobileModal) */}
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