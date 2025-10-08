"use client"

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { useNotes, useDeleteNote, useShareNote } from "@/hooks/use-note";
import { useProfileByUsername } from "@/hooks/use-profile";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw"; // ✅ --- IMPORT THE NEW PLUGIN ---

import { Edit, Trash2, Share2, Search, CheckCircle2, AlertCircle, NotebookPen, Plus, BookOpen, Eye, Heart, MessageCircle, X, MoreHorizontal, Loader2 } from "lucide-react";

// --- INTERFACES ---
interface Profile {
  id: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string;
  name?: string;
}

interface Note {
  id: number;
  title: string;
  content: string;
  updatedAt: string;
  views: { id: number; createdAt: string; viewer: Profile }[];
  likes: { id: number; createdAt: string; profile: Profile }[];
  comments: { id: number; text: string; createdAt: string; author: Profile }[];
  totalViews?: number;
  totalLikes?: number;
  totalComments?: number;
  profile: Profile;
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

// --- HELPER FUNCTIONS ---
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

const stripHtml = (htmlString: string) => {
  if (!htmlString) return "";
  const plainText = htmlString.replace(/<[^>]*>/g, ' ');
  return plainText.replace(/\s\s+/g, ' ').trim();
};

// --- UI COMPONENTS ---
const LoadingState = () => (
  <div className="flex justify-center items-center min-h-[60vh]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const EmptyState = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
    <div className="flex flex-col items-center gap-6 p-10 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 w-full max-w-md">
      <div className="p-4 bg-primary/10 rounded-full">
        <NotebookPen className="w-12 h-12 text-primary" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-800">Your Notebook is Empty</h2>
        <p className="text-slate-500">Let's get started by creating your first note!</p>
      </div>
      <Button asChild size="lg" className="w-full">
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
            <CardDescription className="flex items-center gap-2 text-sm">
              <item.icon className={`w-4 h-4 ${item.color}`} /> {item.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${item.color}`}>{item.value ?? 0}</div>
          </CardContent>
        </Card>
      </motion.div>
    ))}
  </motion.div>
);

const NoteCard = ({ note, onView, onDelete, onShare }: NoteCardProps) => {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
      whileTap={{ scale: 0.98 }}
      layout
      exit={{ opacity: 0, y: 20 }}
      className="group"
    >
      <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 border h-full flex flex-col min-h-[200px]">
        <div className="p-5 flex items-center justify-between gap-4 border-b">
          <div className="flex items-center gap-3 overflow-hidden flex-1">
            <Avatar className="h-10 w-10">
              <AvatarImage src={note.profile?.avatar} alt={note.profile?.username} />
              <AvatarFallback>{getInitials(note.profile)}</AvatarFallback>
            </Avatar>
            <div className="truncate">
              <p className="font-semibold text-slate-800 truncate">{note.profile?.username || "Anonymous"}</p>
              <p className="text-xs text-slate-500">{formatRelativeTime(note.updatedAt)}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-500 flex-shrink-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/edit/${note.id}`} className="flex items-center gap-2 cursor-pointer">
                  <Edit className="w-4 h-4" /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(note.id)} className="flex items-center gap-2 text-red-500 focus:text-red-500 focus:bg-red-50 cursor-pointer">
                <Trash2 className="w-4 h-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="p-5 flex-1 cursor-pointer overflow-hidden" onClick={() => onView(note)}>
          <h2 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
            {note.title}
          </h2>
          <div className="mt-2 text-slate-600 text-sm leading-relaxed line-clamp-3">
            {note.content ? (
              <p>{stripHtml(note.content)}</p>
            ) : (
              <p className="italic text-slate-500">No content.</p>
            )}
          </div>
        </div>
        <div className="px-5 py-3 border-t flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-slate-500">
            {[
              { Icon: Heart, value: note.totalLikes, tooltip: "Likes" },
              { Icon: MessageCircle, value: note.totalComments, tooltip: "Comments" },
              { Icon: Eye, value: note.totalViews, tooltip: "Views" },
            ].map(({ Icon, value, tooltip }) => (
              <Tooltip key={tooltip}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Icon className="w-4 h-4" />
                    <span>{value ?? 0}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent><p>{tooltip}</p></TooltipContent>
              </Tooltip>
            ))}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={(e) => { e.stopPropagation(); onShare(note); }} variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-500 hover:text-indigo-600">
                <Share2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Share Note</p></TooltipContent>
          </Tooltip>
        </div>
      </div>
    </motion.div>
  );
};

const NoteDetailModal = ({ note, isOpen, onOpenChange }: { note: Note | null; isOpen: boolean; onOpenChange: (open: boolean) => void; }) => {
  if (!note) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange} >
      <DialogContent style={{ maxWidth: "100%", width: "1000px", height: "90vh" }}
        className="flex flex-col p-0">
        <DialogHeader className="p-6 border-b flex-shrink-0 relative">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={note.profile?.avatar} />
              <AvatarFallback>{getInitials(note.profile)}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl font-bold line-clamp-1">{note.title}</DialogTitle>
              <DialogDescription className="text-sm mt-1">
                By <span className="font-medium text-indigo-600">{note.profile?.username || "Anonymous"}</span> • {formatRelativeTime(note.updatedAt)}
              </DialogDescription>
            </div>
          </div>

        </DialogHeader>

        <div className="flex-1 grid md:grid-cols-3 overflow-hidden">
          <div className="md:col-span-2 overflow-y-auto p-6">
            {/* ✅ --- FIX: USE rehypeRaw TO RENDER HTML TAGS --- */}
            <div className="prose prose-slate max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]} // <-- ADD THIS LINE
              >
                {note.content || "*No content provided.*"}
              </ReactMarkdown>
            </div>
          </div>

          <div className="md:col-span-1 border-t md:border-t-0 md:border-l flex flex-col bg-slate-50">
            <Tabs defaultValue="comments" className="flex flex-col w-full h-full">
              <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
                <TabsTrigger value="comments"><MessageCircle className="w-4 h-4 mr-1.5" /> {note.totalComments ?? 0}</TabsTrigger>
                <TabsTrigger value="likes"><Heart className="w-4 h-4 mr-1.5" /> {note.totalLikes ?? 0}</TabsTrigger>
                <TabsTrigger value="views"><Eye className="w-4 h-4 mr-1.5" /> {note.totalViews ?? 0}</TabsTrigger>
              </TabsList>
              <div className="flex-1 p-4 overflow-y-auto">
                <TabsContent value="comments"><p className="text-center text-sm text-slate-500 py-4">No comments yet.</p></TabsContent>
                <TabsContent value="likes"><p className="text-center text-sm text-slate-500 py-4">No likes yet.</p></TabsContent>
                <TabsContent value="views"><p className="text-center text-sm text-slate-500 py-4">No views yet.</p></TabsContent>
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
  const { register, handleSubmit, reset, watch } = useForm<ShareFormData>({ resolver: zodResolver(shareSchema) });
  const watchedUsername = watch("username");
  const debouncedSearchTerm = useDebounce(watchedUsername || "", 500);
  const { data: targetProfile, isFetching: isFetchingProfile } = useProfileByUsername(debouncedSearchTerm);
  const userNotFound = debouncedSearchTerm && !isFetchingProfile && !targetProfile;
  const isShareDisabled = !targetProfile || isFetchingProfile || shareMutation.isPending;

  const onShareSubmit = () => {
    if (!targetProfile || !note) return;
    shareMutation.mutate({ noteId: note.id, targetProfileId: targetProfile.id }, {
      onSuccess: () => { reset(); onOpenChange(false); },
    });
  };

  if (!note) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) reset(); onOpenChange(open); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Share "{note.title}"</DialogTitle><DialogDescription>Share this note with another user.</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit(onShareSubmit)} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input id="username" placeholder="Start typing..." className="pl-10" {...register("username")} /></div>
          </div>
          {isFetchingProfile && <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Searching...</div>}
          {userNotFound && <div className="text-sm text-destructive flex items-center gap-2"><AlertCircle className="w-4 h-4" />User not found.</div>}
          {targetProfile && <div className="p-3 bg-green-500/10 border rounded-lg flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarImage src={targetProfile.avatar} /><AvatarFallback>{getInitials(targetProfile)}</AvatarFallback></Avatar><p className="font-medium">{targetProfile.username}</p><CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" /></div>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isShareDisabled}>{shareMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Sharing...</> : <><Share2 className="w-4 h-4 mr-2" />Share Note</>}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function NotesListPage() {
  const { data: notes, isLoading: isNotesLoading } = useNotes();
  const { data: stats } = useDashboardStats();
  const deleteMutation = useDeleteNote();

  const [noteForView, setNoteForView] = useState<Note | null>(null);
  const [noteForShare, setNoteForShare] = useState<Note | null>(null);

  const handleDeleteNote = (id: number) => deleteMutation.mutate(id);

  if (isNotesLoading) return <LoadingState />;
  if (!notes || notes.length === 0) return <EmptyState />;

  return (
    <TooltipProvider delayDuration={100}>
      <div className="space-y-8 bg-slate-50 h-screen overflow-y-auto p-8">
        <header className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-primary/10">
            <BookOpen className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Notes</h1>
            <p className="text-base text-slate-500">{notes.length} note{notes.length !== 1 ? 's' : ''} in your collection</p>
          </div>
        </header>

        <DashboardStats stats={stats} />

        <motion.div
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          initial="hidden"
          animate="show"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
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