"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { useNotes, useDeleteNote, useShareNote } from "@/hooks/use-note"
import { useProfileByUsername } from "@/hooks/use-profile"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Edit, Trash2, Share2, Search, CheckCircle2, AlertCircle, NotebookPen, Plus, Clock, BookOpen, Eye, Heart, MessageCircle, User, X, MoreHorizontal, Loader2 } from "lucide-react"

const MonacoViewer = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[200px] sm:h-[400px] flex items-center justify-center bg-muted rounded-lg">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

interface Profile {
  id: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string;
  name?: string;
}

interface NoteView {
  id: number;
  createdAt: string;
  viewer: Profile;
}

interface NoteLike {
  id: number;
  createdAt: string;
  profile: Profile;
}

interface NoteComment {
  id: number;
  text: string;
  createdAt: string;
  author: Profile;
}

interface Note {
  id: number;
  title: string;
  content: string;
  updatedAt: string;
  views: NoteView[];
  likes: NoteLike[];
  comments: NoteComment[];
  totalViews?: number;
  totalLikes?: number;
  totalComments?: number;
  profile: Profile;
  sharedWith?: Profile[];
}

interface NoteCardProps {
  note: Note;
  onView: (note: Note) => void;
  onDelete: (id: number) => void;
  onShare: (note: Note) => void;
}


const shareSchema = z.object({
  username: z.string().min(1, "Username is required"),
});
type ShareFormData = z.infer<typeof shareSchema>;

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const getInitials = (profile?: Profile) => {
  if (!profile) return "U";
  const name = profile.username || profile.firstName || "User";
  return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
};

const formatRelativeTime = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return diffInDays < 7 ? `${diffInDays}d ago` : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const LoadingState = () => (
  <div className="flex justify-center items-center min-h-[60vh]">
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </motion.div>
  </div>
);

const EmptyState = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
    <div className="flex flex-col items-center gap-6 p-6 sm:p-10 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 w-full max-w-md">
      <div className="p-4 bg-primary/10 rounded-full">
        <NotebookPen className="w-12 h-12 text-primary" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Your Notebook is Empty</h2>
        <p className="text-slate-500 max-w-sm">It seems you haven't created any notes yet. Let's get started!</p>
      </div>
      <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
        <Link href="/dashboard/new"><Plus className="w-5 h-5 mr-2" /> Create First Note</Link>
      </Button>
    </div>
  </motion.div>
);

const DashboardStats = ({ stats }: { stats: any }) => (
  <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
    {[
      { title: "Total Notes", value: stats?.totalNotes, icon: BookOpen, color: "text-primary", bg: "bg-primary/5" },
      { title: "Total Views", value: stats?.totalViews, icon: Eye, color: "text-blue-600", bg: "bg-blue-500/5" },
      { title: "Total Likes", value: stats?.totalLikes, icon: Heart, color: "text-red-500", bg: "bg-red-500/5" },
      { title: "Total Comments", value: stats?.totalComments, icon: MessageCircle, color: "text-green-600", bg: "bg-green-500/5" },
    ].map(item => (
      <motion.div key={item.title} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}>
        <Card className={`overflow-hidden border-border/50 ${item.bg} p-4`}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
              <item.icon className={`w-4 h-4 ${item.color}`} /> {item.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-2xl font-bold ${item.color}`}>{item.value ?? 0}</div>
          </CardContent>
        </Card>
      </motion.div>
    ))}
  </motion.div>
);

export const NoteCard = ({ note, onView, onDelete, onShare }: NoteCardProps) => {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
      whileTap={{ scale: 0.98 }}
      layout
      exit={{ opacity: 0, y: 20 }}
      className="group"
    >
      <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 border border-slate-200/80 h-full flex flex-col min-h-[200px]">

        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between gap-3 sm:gap-4 border-b border-slate-100">
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden flex-1 min-w-0">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
              <AvatarImage src={note.profile?.avatar} alt={note.profile?.username} />
              <AvatarFallback>{getInitials(note.profile)}</AvatarFallback>
            </Avatar>
            <div className="truncate min-w-0">
              <p className="font-semibold text-slate-800 truncate text-sm sm:text-base">
                {note.profile?.username || "Anonymous"}
              </p>
              <p className="text-xs text-slate-500">{formatRelativeTime(note.updatedAt)}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100 flex-shrink-0"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/edit/${note.id}`}
                  className="flex items-center gap-2 w-full cursor-pointer"
                >
                  <Edit className="w-4 h-4" /> Edit
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => onDelete(note.id)}
                className="flex items-center gap-2 text-red-500 focus:text-red-500 focus:bg-red-50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Body */}
        <div
          className="p-4 sm:p-5 flex-1 cursor-pointer overflow-hidden"
          onClick={() => onView(note)}
        >
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate line-clamp-2 sm:line-clamp-1">
            {note.title}
          </h2>

          {/* ✅ Markdown & HTML render */}
          <div className="mt-2 prose prose-slate dark:prose-invert text-sm leading-relaxed line-clamp-3">
            {note.content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {note.content}
              </ReactMarkdown>
            ) : (
              <p className="italic text-slate-500">No content.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-4 text-slate-500 flex-1 min-w-0">
            {[
              { Icon: Heart, value: note.totalLikes, color: "hover:text-rose-500", tooltip: "Likes" },
              { Icon: MessageCircle, value: note.totalComments, color: "hover:text-emerald-600", tooltip: "Comments" },
              { Icon: Eye, value: note.totalViews, color: "hover:text-blue-600", tooltip: "Views" },
            ].map(({ Icon, value, color, tooltip }) => (
              <Tooltip key={tooltip}>
                <TooltipTrigger asChild>
                  <button
                    className={`flex items-center gap-1 transition-colors ${color} text-xs sm:text-sm min-w-0 truncate`}
                  >
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="truncate">{value}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(note);
                }}
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-slate-500 hover:bg-slate-100 hover:text-indigo-600 flex-shrink-0"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share Note</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </motion.div>
  );
};

const InteractionListItem = ({ profile, date, text }: { profile?: Profile; date?: string; text?: string }) => (
  <div className="flex gap-3 py-2 sm:py-3 border-b border-slate-100 last:border-b-0">
    <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
      <AvatarImage src={profile?.avatar} />
      <AvatarFallback>{getInitials(profile)}</AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm text-slate-800 truncate">{profile?.username || "Anonymous"}</p>
        <p className="text-xs text-slate-500">{formatDate(date)}</p>
      </div>
      {text && <p className="text-sm mt-1 text-slate-600 line-clamp-2">{text}</p>}
    </div>
  </div>
);

const NoteDetailModal = ({
  note,
  isOpen,
  onOpenChange,
}: {
  note: Note | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  if (!note) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          max-w-none
          w-[95vw]
          h-[95vh]
          sm:w-[1000px]
          sm:h-[680px]
          !max-w-[1000px]
          flex flex-col
        "
      >
        {/* Header */}
        <DialogHeader className="p-4 sm:p-6 border-b bg-gradient-to-r from-indigo-50 to-purple-50 flex-shrink-0">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-indigo-200">
                <AvatarImage src={note.profile?.avatar} />
                <AvatarFallback className="text-base sm:text-lg">
                  {getInitials(note.profile)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-xl sm:text-2xl font-bold line-clamp-1">
                  {note.title}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm mt-1 text-slate-500 line-clamp-1">
                  By{" "}
                  <span className="font-medium text-indigo-600">
                    {note.profile?.username || "Anonymous"}
                  </span>{" "}
                  • {formatRelativeTime(note.updatedAt)}
                </DialogDescription>
              </div>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full ml-auto sm:ml-0">
                <X className="w-5 h-5" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 flex flex-col md:grid md:grid-cols-3 overflow-hidden bg-slate-50">
          {/* 📝 Editor Panel */}
          <div className="w-full md:col-span-2 p-2 sm:p-4 overflow-y-auto bg-white flex-1">
            <div className="rounded-xl border border-slate-200 shadow-inner p-1 sm:p-2 bg-slate-50 h-full">
              <MonacoViewer
                height="100%"
                language="markdown"
                value={note.content}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 12,
                  wordWrap: "on",
                  padding: { top: 10 },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  contextmenu: false,
                }}
                theme="vs-light"
              />
            </div>
          </div>

          {/* 📊 Interaction Panel */}
          <div className="w-full md:col-span-1 border-t md:border-t-0 md:border-l border-slate-200 bg-white flex flex-col h-[30vh] sm:h-auto min-h-0">
            <Tabs defaultValue="comments" className="flex flex-col w-full h-full">
              <TabsList className="grid w-full grid-cols-3 rounded-none border-b bg-slate-50 h-10 sm:h-12 p-1">
                <TabsTrigger value="comments" className="gap-1 text-xs sm:text-sm data-[state=active]:text-indigo-600 p-2">
                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" /> {note.totalComments}
                </TabsTrigger>
                <TabsTrigger value="likes" className="gap-1 text-xs sm:text-sm data-[state=active]:text-rose-500 p-2">
                  <Heart className="w-3 h-3 sm:w-4 sm:h-4" /> {note.totalLikes}
                </TabsTrigger>
                <TabsTrigger value="views" className="gap-1 text-xs sm:text-sm data-[state=active]:text-blue-600 p-2">
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" /> {note.totalViews}
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 w-full p-2 sm:p-4 overflow-y-auto">
                <TabsContent value="comments">
                  {note.comments?.length ? (
                    note.comments.map((c) => (
                      <InteractionListItem
                        key={c.id}
                        profile={c.author}
                        date={c.createdAt}
                        text={c.text}
                      />
                    ))
                  ) : (
                    <p className="text-center text-xs sm:text-sm text-slate-500 py-4">
                      No comments yet.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="likes">
                  {note.likes?.length ? (
                    note.likes.map((l) => (
                      <InteractionListItem
                        key={l.id}
                        profile={l.profile}
                        date={l.createdAt}
                      />
                    ))
                  ) : (
                    <p className="text-center text-xs sm:text-sm text-slate-500 py-4">
                      No likes yet.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="views">
                  {note.views?.length ? (
                    note.views.map((v) => (
                      <InteractionListItem
                        key={v.id}
                        profile={v.viewer}
                        date={v.createdAt}
                      />
                    ))
                  ) : (
                    <p className="text-center text-xs sm:text-sm text-slate-500 py-4">
                      No views yet.
                    </p>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ShareNoteDialog = ({ note, isOpen, onOpenChange }: { note: Note | null; isOpen: boolean; onOpenChange: (open: boolean) => void }) => {
  const shareMutation = useShareNote();
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ShareFormData>({ resolver: zodResolver(shareSchema) });
  const watchedUsername = watch("username");
  const debouncedSearchTerm = useDebounce(watchedUsername || "", 500);
  const { data: targetProfile, isFetching: isFetchingProfile } = useProfileByUsername(debouncedSearchTerm);
  const userNotFound = debouncedSearchTerm && !isFetchingProfile && !targetProfile;
  const isShareDisabled = !targetProfile || isFetchingProfile || shareMutation.isPending;

  const onShareSubmit = (data: ShareFormData) => {
    if (!targetProfile || !note) return;
    shareMutation.mutate({ noteId: note.id, targetProfileId: targetProfile.id }, {
      onSuccess: () => { reset(); onOpenChange(false); },
    });
  };

  if (!note) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) reset(); onOpenChange(open); }}>
      <DialogContent className="sm:max-w-md p-0 w-[90vw] max-h-[80vh]">
        <DialogHeader className="p-4 sm:p-6 border-b"><DialogTitle className="text-lg sm:text-xl">Share "{note.title}"</DialogTitle><DialogDescription className="text-sm">Share this note with another user by their username.</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit(onShareSubmit)} className="overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-4 max-h-[50vh]">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="username" placeholder="Start typing..." className={cn("pl-10", errors.username && "border-destructive")} {...register("username")} />
              </div>
            </div>
            {isFetchingProfile && <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Searching...</div>}
            {userNotFound && <div className="text-sm text-destructive flex items-center gap-2"><AlertCircle className="w-4 h-4" />User not found.</div>}
            {targetProfile && <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarImage src={targetProfile.avatar} /><AvatarFallback>{getInitials(targetProfile)}</AvatarFallback></Avatar><div><p className="font-medium truncate">{targetProfile.username}</p></div><CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" /></div>}
          </div>
          <DialogFooter className="p-4 border-t bg-slate-50 flex-shrink-0">
            <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isShareDisabled} className="flex-1 sm:flex-none ml-2 sm:ml-0">{shareMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}{shareMutation.isPending ? "Sharing..." : "Share Note"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function NotesListPage() {
  const { data: notes, isLoading: isNotesLoading } = useNotes();
  const { data: stats } = useDashboardStats();
  const deleteMutation = useDeleteNote();

  const [noteForView, setNoteForView] = useState<Note | null>(null);
  const [noteForShare, setNoteForShare] = useState<Note | null>(null);

  const handleDeleteNote = (id: number) => deleteMutation.mutate(id);

  if (isNotesLoading) {
    return <LoadingState />;
  }

  if (!notes || notes.length === 0) {
    return <EmptyState />;
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="space-y-6 sm:space-y-8 bg-slate-50 h-screen overflow-y-auto p-2 sm:p-4 md:p-6 lg:p-8">
        <header className="flex items-center gap-3 sm:gap-4 pb-4">
          <div className="p-2 sm:p-3 rounded-full bg-primary/10">
            <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My Notes</h1>
            <p className="text-sm sm:text-base text-slate-500">{notes.length} note{notes.length !== 1 ? 's' : ''} in your collection</p>
          </div>
        </header>

        <DashboardStats stats={stats} />

        <motion.div
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full"
        >
          <AnimatePresence>
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onView={setNoteForView}
                onDelete={handleDeleteNote}
                onShare={setNoteForShare}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      <NoteDetailModal note={noteForView} isOpen={!!noteForView} onOpenChange={() => setNoteForView(null)} />
      <ShareNoteDialog note={noteForShare} isOpen={!!noteForShare} onOpenChange={() => setNoteForShare(null)} />
    </TooltipProvider>
  );
}