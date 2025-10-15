
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, Variants, number } from "framer-motion"; // AnimatePresence qo'shildi
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useSharedNotes } from "@/hooks/use-note";
import {
  useAddView,
  useGetComments,
  useAddComment,
  useDeleteComment,
  useToggleLike
} from "@/hooks/use-note-interactions";
import { useMyProfile } from "@/hooks/use-profile";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Loader2, Share2, Clock, Heart, Eye, MessageCircle, Send, Trash2, ChevronLeft } from "lucide-react"; // ChevronLeft qo'shildi
import { queryClient } from "@/lib/query-client";

interface Profile { id: number; username?: string; avatar?: string; }
interface Note { id: number; title: string; content: string; updatedAt: string | Date; profile: Profile; views: { profile_id: number; }[]; likes: { profile_id: number; }[]; comments: any[]; }
interface Comment { id: number; text: string; createdAt: string | Date; author: Profile; }

const getInitials = (profile: Profile) => {
  if (!profile || !profile.username) return "U";
  return profile.username.slice(0, 2).toUpperCase();
};

const formatDate = (date: string | Date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const formatRelativeTime = (dateString?: string | Date) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return `${diffInSeconds} soniya avval`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} daqiqa avval`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} soat avval`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const stripHtml = (htmlString: string) => {
  if (!htmlString) return "";
  const doc = new DOMParser().parseFromString(htmlString, 'text/html');
  return doc.body.textContent || "";
};

const commentSchema = z.object({ text: z.string().min(1, "Izoh bo'sh bo'lishi mumkin emas").max(500, "Izoh 500 belgidan oshmasligi kerak") });

const AddCommentForm = ({ noteId }: { noteId: number }) => {
  const form = useForm<{ text: string }>({ resolver: zodResolver(commentSchema), defaultValues: { text: "" } });
  const addCommentMutation = useAddComment();
  const { refetch } = useGetComments(noteId);

  const onSubmit = (data: { text: string }) => {
    addCommentMutation.mutate({ noteId, text: data.text }, {
      onSuccess: () => {
        form.reset({ text: "" }) // Faqat textni reset qildi
        refetch()
        toast.success("Izoh qo'shildi")
      },
      onError: () => toast.error("Izoh qo'shishda xatolik yuz berdi"),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
        <FormField control={form.control} name="text" render={({ field }) => (
          <FormItem className="flex-1">
            <FormControl>
              <Textarea
                placeholder="Fikr bildiring..."
                {...field}
                className="bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 resize-none min-h-[40px]"
                rows={1} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button
          type="submit"
          size="icon"
          disabled={addCommentMutation.isPending || !form.formState.isValid} // Validatsiyani tekshirish
          className="bg-violet-600 text-white dark:bg-violet-600 dark:hover:bg-violet-500 hover:bg-violet-700 flex-shrink-0 h-10 w-10" // Katta tugma
        >
          {addCommentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </Form>
  );
};

const CommentItem = ({ comment, currentProfileId, onDelete }: { comment: Comment; currentProfileId?: number; onDelete: (id: number) => void; }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
    <Avatar className="h-8 w-8 flex-shrink-0"><AvatarImage src={comment.author.avatar} /><AvatarFallback>{getInitials(comment.author)}</AvatarFallback></Avatar>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{comment.author.username}</p>
        {currentProfileId === comment.author.id && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-red-500 dark:hover:bg-slate-700 flex-shrink-0" onClick={() => onDelete(comment.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words">{comment.text}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{formatRelativeTime(comment.createdAt)}</p>
    </div>
  </div>
);

const CommentSection = ({ noteId, onBack }: { noteId: number, onBack: () => void }) => {
  const { data: comments, isLoading, refetch } = useGetComments(noteId);
  const { data: me } = useMyProfile();
  const deleteCommentMutation = useDeleteComment();

  const handleDelete = (commentId: number, noteId: number) => {
    toast.promise(
      deleteCommentMutation.mutateAsync({ commentId, noteId }),
      { loading: "O‘chirilmoqda...", success: "Izoh o‘chirildi", error: "Xatolik yuz berdi" }
    );
    queryClient.invalidateQueries({ queryKey: ['noteComments', noteId] }); // Refresh
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-50 dark:bg-slate-900/50 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 flex-shrink-0 md:min-h-full">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex-grow text-center md:text-left">
          Izohlar ({comments?.length || 0})
        </h3>
        <div className="hidden md:block w-10"></div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 min-h-0">
        {isLoading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 my-3 bg-slate-200 dark:bg-slate-800" />)
          : !comments || comments.length === 0 ? <p className="text-sm text-slate-500 text-center py-10">Hali izohlar yo'q. Birinchi bo'ling!</p>
            : comments.map(comment => <CommentItem key={comment.id} comment={comment} currentProfileId={me?.profile?.id} onDelete={() => handleDelete(comment?.id, noteId)} />)
        }
      </div>
      <div className="p-4 flex-shrink-0 border-t border-slate-200 dark:border-slate-800"><AddCommentForm noteId={noteId} /></div>
    </div>
  );
};

const modalVariants: Variants = {
  hidden: { opacity: 0, y: "100vh", scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, type: "spring", damping: 25, stiffness: 350 } },
  exit: { opacity: 0, y: "100vh", transition: { duration: 0.2 } },
};

const LikeButton = ({ note, currentProfileId, toggleLike }: { note: Note, currentProfileId: number, toggleLike: (noteId: number) => void }) => {
  const isLiked = note.likes.some(like => like.profile_id === currentProfileId);
  const totalLikes = note.likes.length;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => toggleLike(note.id)}
      className={`flex items-center gap-1.5 text-sm transition-colors ${isLiked ? 'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
    >
      <motion.div whileTap={{ scale: 1.5 }}>
        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
      </motion.div>
      {totalLikes}
    </Button>
  );
};


export default function SharedNotesPage() {
  const { data: sharedNotes, isLoading, refetch: refetchSharedNotes } = useSharedNotes();
  const { data: myProfile } = useMyProfile();
  const [selectedNote, setSelectedNote] = useState<Note | any>(null);
  const [isMobileCommentView, setIsMobileCommentView] = useState(false); // Mobile state for comment section visibility
  const currentProfileId = myProfile?.profile?.id;

  const addViewMutation = useAddView(selectedNote?.id as number);
  const toggleLikeMutation = useToggleLike(selectedNote?.id as number); // <-- Toggle Like hook

  useEffect(() => {
    if (selectedNote?.id) {
      addViewMutation.mutate();
    }
  }, [selectedNote]);

  const handleToggleLike = useCallback((noteId: any) => {
    toggleLikeMutation.mutate(noteId, {
      onSuccess: () => {
        refetchSharedNotes();
      },
      onError: () => toast.error("Like qo'yishda xatolik yuz berdi")
    });
  }, [toggleLikeMutation, refetchSharedNotes]);


  const handleCloseModal = () => {
    setIsMobileCommentView(false);
    setSelectedNote(null);
  };

  const handleOpenComments = (note: Note) => {
    setSelectedNote(note);
    setIsMobileCommentView(true);
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 sm:p-8 md:p-10 space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-violet-100 dark:bg-violet-500/10">
            <Share2 className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Men bilan ulashilgan</h1>
            <p className="text-slate-500 dark:text-slate-400">{sharedNotes?.length || 0} ta eslatma ulashilgan</p>
          </div>
        </motion.div>

        {!sharedNotes || sharedNotes.length === 0 ? (
          <div className="text-center py-20 px-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg mt-6">
            <Share2 className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
            <h3 className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-300">Hali ulashilgan eslatmalar yo'q</h3>
            <p className="mt-1 text-sm text-slate-500">Boshqalar siz bilan eslatma ulashganda, ular shu yerda paydo bo'ladi.</p>
          </div>
        ) : (
          <motion.div
            initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }}
            className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {sharedNotes.map((note) => (
              <motion.div key={note.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="h-full">
                <Card className="h-full flex flex-col bg-white dark:bg-slate-800/80
border border-slate-200 dark:border-slate-700
hover:border-violet-300 dark:hover:border-violet-500/50
transition-colors cursor-pointer rounded-xl sm:rounded-2xl"
                  onClick={() => setSelectedNote(note)}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-slate-200 dark:border-slate-600"><AvatarImage src={note.profile.avatar} /><AvatarFallback className="bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">{getInitials(note.profile)}</AvatarFallback></Avatar>
                      <div>
                        <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">Ulashdi: {note.profile.username}</CardTitle>
                        <CardDescription className="text-xs text-slate-500 dark:text-slate-500">{formatDate(note.updatedAt)}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2 truncate">{note.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 sm:line-clamp-4">{stripHtml(note.content) || "Mazmun yo'q."}</p>
                  </CardContent>
                  <CardFooter className="border-t border-slate-200 dark:border-slate-700/50 pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" /> {note.likes.length}</span>
                      <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /> {note.comments.length}</span>
                      <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {note.views.length}</span>
                    </div>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); setSelectedNote(note); }} className="bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-600 dark:text-white dark:hover:bg-violet-500">
                      Ko'rish
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* NoteDetail Dialog: Framer Motion va Fullscreen Mobile uchun o'zgartirildi */}
      <AnimatePresence>
        {selectedNote && (
          <Dialog open={!!selectedNote} onOpenChange={handleCloseModal}>
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={modalVariants}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none"
            >
              <DialogContent
                className="p-0 sm:max-w-6xl w-full h-full sm:h-[90vh] data-[state=open]:animate-none data-[state=closed]:animate-none pointer-events-auto flex flex-col overflow-hidden" // Mobile: h-full
              >
                {/* Asosiy Kontent Va Izohlar Bloki */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 min-h-0 overflow-hidden">

                  {/* Note Kontenti */}
                  <div className={`flex flex-col min-h-0 transition-all duration-300 ${isMobileCommentView ? 'hidden' : 'md:col-span-2'}`}>
                    <DialogHeader className="p-6 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                      <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-50 line-clamp-2">{selectedNote.title}</DialogTitle>
                      <DialogDescription className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        Ulashdi: <span className="font-medium text-violet-600 dark:text-violet-400 truncate">{selectedNote.profile.username}</span>
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-8 prose dark:prose-invert max-w-none min-h-0">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {selectedNote.content || "*Mazmun yo'q.*"}
                      </ReactMarkdown>
                    </div>
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex-shrink-0 flex items-center justify-between">

                      <div className="flex items-center gap-4">
                        {currentProfileId && (
                          <LikeButton note={selectedNote} currentProfileId={currentProfileId} toggleLike={handleToggleLike} />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsMobileCommentView(true)}
                          className="md:hidden flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-violet-500" // Mobile Comment Button
                        >
                          <MessageCircle className="w-4 h-4" /> {selectedNote.comments.length}
                        </Button>
                        <span className="hidden md:flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><MessageCircle className="w-4 h-4" /> {selectedNote.comments.length}</span>
                        <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><Eye className="w-4 h-4" /> {selectedNote.views.length}</span>
                      </div>
                      <Button variant="outline" onClick={handleCloseModal} className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
                        Yopish
                      </Button>
                    </div>
                  </div>

                  {/* Izohlar Bo'limi */}
                  <div className={`md:col-span-1 min-h-0 transition-all duration-300 ${isMobileCommentView ? 'flex flex-col w-full' : 'hidden md:flex'}`}>
                    <CommentSection noteId={selectedNote.id} onBack={() => setIsMobileCommentView(false)} />
                  </div>
                </div>
              </DialogContent>
            </motion.div>
          </Dialog>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}