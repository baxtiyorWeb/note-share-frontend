"use client"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useSharedNotes } from "@/hooks/use-note"
import { useGetComments, useToggleLike, useAddView, useAddComment, useDeleteComment } from "@/hooks/use-note-interactions"
import { useMyProfile } from "@/hooks/use-profile"
import { Loader2, Share2, Clock, User, Heart, Eye, MessageCircle, Lock, X } from "lucide-react"
import { motion, Variants } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
const MonacoViewer = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] flex items-center justify-center bg-muted rounded-lg">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

const commentSchema = z.object({
  text: z.string().min(1, "Comment cannot be empty").max(500, "Comment too long"),
});

type CommentFormData = z.infer<typeof commentSchema>;

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const cardVariants: Variants = {
  hidden: { scale: 0.95, opacity: 0, y: 20 },
  show: { scale: 1, opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
  hover: {
    scale: 1.02,
    y: -5,
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    transition: { duration: 0.3, ease: [0.42, 0, 0.58, 1] }
  }
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }
  }
};

interface Note {
  id: number;
  title: string;
  content: string;
  updatedAt: string | Date;
  profile: {
    id: number;
    username?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  views: { id: number }[];
  likes: { id: number }[];
  comments: any[]; // Simplified
}

interface Comment {
  id: number;
  text: string;
  createdAt: string;
  author: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
}

export default function SharedNotesPage() {
  const { data: sharedNotes, isLoading } = useSharedNotes();
  const { data: myProfile } = useMyProfile();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false); // Local state for like status
  const [selectedCommentNoteId, setSelectedCommentNoteId] = useState<number | null>(null);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const {
    register: commentRegister,
    handleSubmit: handleCommentSubmit,
    formState: { errors: commentErrors },
    reset: resetComment,
    watch,
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  });

  // Interactions for selected note
  const addViewMutation = useAddView(selectedNote?.id || 0);
  const toggleLikeMutation = useToggleLike(selectedNote?.id || 0);
  const { data: comments } = useGetComments(selectedCommentNoteId || 0);
  const addCommentMutation = useAddComment();
  const deleteCommentMutation = useDeleteComment();
  const commentValue = watch("text");

  const getInitials = (profile: any) => {
    const name = profile?.username || profile?.firstName || "U";
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewNote = async (note: Note) => {
    setSelectedNote(note);
    setIsLiked(false); // Reset like state
    // Auto-add view on open
    if (myProfile?.profile.id && note.id) {
      await addViewMutation.mutateAsync();
    }
    setIsModalOpen(true);
  };

  const handleToggleLike = () => {
    if (selectedNote?.id) {
      toggleLikeMutation.mutate(undefined, {
        onSuccess: (data) => {
          setIsLiked(data.liked);
        },
      });
    }
  };

  const onAddComment = (data: CommentFormData) => {
    if (selectedCommentNoteId) {
      addCommentMutation.mutate({ noteId: selectedCommentNoteId, text: data.text }, {
        onSuccess: () => {
          resetComment();
        },
      });
    }
  };

  const handleDeleteComment = (commentId: number) => {
    deleteCommentMutation.mutate(commentId);
  };

  const openCommentsModal = (noteId: number) => {
    setSelectedCommentNoteId(noteId);
    setIsCommentsModalOpen(true);
  };

  const closeCommentsModal = () => {
    setIsCommentsModalOpen(false);
    setSelectedCommentNoteId(null);
    resetComment();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  if (!sharedNotes || sharedNotes.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Shared with Me
            </h1>
            <p className="text-muted-foreground mt-2">Notes that others have shared with you</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center justify-center text-center py-12 text-muted-foreground min-h-[50vh] bg-gradient-to-b from-muted/20 to-transparent rounded-2xl"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 p-4"
            >
              <Share2 className="w-10 h-10 text-primary/60" />
            </motion.div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">No shared notes yet</h3>
            <p className="text-sm max-w-md">Share some notes with friends or wait for others to share with you. They'll appear here once shared.</p>
            <Button
              asChild
              className="mt-6 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg"
            >
              <Link href="/dashboard">
                Back to My Notes
              </Link>
            </Button>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="p-2 rounded-full bg-gradient-to-br from-primary/10 to-accent/10">
            <Share2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Shared with Me</h1>
            <p className="text-muted-foreground">{sharedNotes.length} note{sharedNotes.length !== 1 ? 's' : ''} shared</p>
          </div>
        </motion.div>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {sharedNotes.map((note) => {
            const ownerProfile = note.profile;
            const ownerUsername = ownerProfile.username || `${ownerProfile.firstName || ''} ${ownerProfile.lastName || ''}`.trim() || "Anonymous";
            const ownerAvatar = ownerProfile.avatar;
            const ownerInitials = getInitials(ownerProfile);
            const updateDate = formatDate(note.updatedAt);
            const viewCount = note.views?.length || 0;
            const likeCount = note.likes?.length || 0;
            const commentCount = note.comments?.length || 0;

            return (
              <motion.div key={note.id} variants={cardVariants} whileHover="hover" className="h-full">
                <Card className="h-full border-2 border-primary/20 hover:border-primary/50 transition-all flex flex-col overflow-hidden shadow-sm hover:shadow-primary/10">
                  {/* Header with Owner and Date */}
                  <CardHeader className="pb-4 bg-gradient-to-r from-primary/2 to-accent/2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                          {ownerAvatar ? (
                            <AvatarImage src={ownerAvatar} alt={ownerUsername} className="object-cover" />
                          ) : null}
                          <AvatarFallback className="h-10 w-10 text-sm font-semibold bg-gradient-to-br from-primary to-accent text-white">
                            {ownerInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="line-clamp-1 text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            {note.title}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            Shared by {ownerUsername}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-xs px-2 py-1 bg-primary/10 text-primary">
                          <Clock className="w-3 h-3 mr-1" />
                          {updateDate}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 pt-0 px-0 pb-0">
                    <div className="p-4">
                      <div className="prose prose-slate dark:prose-invert text-sm leading-relaxed line-clamp-4">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {note.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                    {/* Interactions Bar */}
                    <div className="px-4 pb-4 border-t border-border/50 bg-muted/20">
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-muted-foreground hover:text-primary hover:bg-primary/5"
                            onClick={handleToggleLike}
                          >
                            <Heart className={cn("w-4 h-4", toggleLikeMutation.isPending ? "fill-current" : "")} />
                            <span className="text-xs">{likeCount}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-muted-foreground hover:text-primary hover:bg-primary/5"
                            onClick={() => openCommentsModal(note.id)}
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-xs">{commentCount}</span>
                          </Button>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="w-4 h-4" />
                            <span>{viewCount}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewNote(note)}
                          className="gap-2 hover:bg-primary/5 text-primary hover:text-primary/90 transition-all duration-200"
                        >
                          <User className="w-4 h-4" />
                          View full note
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Full Note Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="
          max-w-none
          w-[95vw]
          h-[95vh]
          sm:w-[1000px]
          sm:h-[680px]
          !max-w-[1000px]
          flex flex-col
        ">
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="flex flex-col h-full"
          >
            {/* Enhanced Header with Interactions */}
            <DialogHeader className="p-6 border-b border-primary/10 bg-gradient-to-r from-primary/5 to-accent/5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/30">
                    {selectedNote?.profile.avatar ? (
                      <AvatarImage src={selectedNote.profile.avatar} alt={selectedNote.profile.username} className="object-cover" />
                    ) : null}
                    <AvatarFallback className="h-12 w-12 text-base font-semibold bg-gradient-to-br from-primary to-accent text-white">
                      {getInitials(selectedNote?.profile)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-2xl font-bold line-clamp-1">{selectedNote?.title}</DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <DialogDescription className="text-sm text-muted-foreground truncate">
                        Shared by {selectedNote?.profile.username || `${selectedNote?.profile.firstName} ${selectedNote?.profile.lastName}`.trim() || "Anonymous"}
                      </DialogDescription>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      {/* Date Badge */}
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Clock className="w-3 h-3" />
                        Updated {formatDate(selectedNote?.updatedAt || "")}
                      </Badge>
                      {/* Interactions */}
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-muted-foreground hover:text-primary hover:bg-primary/5 h-8"
                          onClick={handleToggleLike}
                          disabled={toggleLikeMutation.isPending}
                        >
                          <Heart className={cn("w-4 h-4 transition-colors", isLiked ? "fill-current text-red-500" : "")} />
                          <span className="text-xs">{selectedNote?.likes?.length || 0}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-muted-foreground hover:text-primary hover:bg-primary/5 h-8"
                          onClick={() => openCommentsModal(selectedNote?.id || 0)}
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span className="text-xs">{selectedNote?.comments?.length || 0}</span>
                        </Button>
                        <Badge variant="outline" className="gap-1 text-xs h-8 px-3">
                          <Eye className="w-3 h-3" />
                          {selectedNote?.views?.length || 0} views
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogClose asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-primary/10">
                    <X className="h-4 w-4" />
                  </Button>
                </DialogClose>
              </div>
            </DialogHeader>


            <div className="flex-1 overflow-y-auto p-6 prose prose-slate dark:prose-invert max-w-none">
              {selectedNote?.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedNote.content}
                </ReactMarkdown>
              ) : (
                <div className="h-full flex items-center justify-center bg-muted/50">
                  <p className="text-muted-foreground text-lg">No content available</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <DialogFooter className="p-6 border-t border-primary/10 bg-muted/5">
              <div className="flex w-full justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  <span>This is a shared note. You cannot edit it.</span>
                </div>
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="gap-2">
                    <X className="w-4 h-4" />
                    Close
                  </Button>
                </DialogClose>
              </div>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Comments Modal */}
      <Dialog open={isCommentsModalOpen} onOpenChange={setIsCommentsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Comments ({comments?.length || 0})
            </DialogTitle>
            <DialogDescription>Discuss this note with others</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {comments?.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-3 p-3 bg-card border rounded-lg"
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  {comment.author?.avatar ? (
                    <AvatarImage src={comment.author.avatar} alt={comment.author.username || 'User'} />
                  ) : null}
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(comment.author)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{comment.author.username}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground break-words">{comment.text}</p>
                  {comment.author.id === myProfile?.profile.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteComment(comment.id)}
                      className="mt-2 h-6 px-2 text-xs text-destructive hover:text-destructive/80"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
            {comments?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
          <form onSubmit={handleCommentSubmit(onAddComment)} className="border-t p-4 bg-muted/5">
            <div className="flex gap-2">
              <Input
                placeholder="Add a comment..."
                {...commentRegister("text")}
                className={cn(commentErrors.text ? "border-destructive" : "")}
                disabled={addCommentMutation.isPending}
              />
              <Button
                type="submit"
                size="sm"
                disabled={addCommentMutation.isPending || !commentValue?.trim()}
                className="gap-1"
              >
                {addCommentMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageCircle className="w-4 h-4" />
                )}
              </Button>
            </div>
            {commentErrors.text && <p className="text-sm text-destructive mt-1">{commentErrors.text.message}</p>}
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}