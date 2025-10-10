"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import _ from "lodash";
import { useNotes, useDeleteNote, useShareNote } from "@/hooks/use-note";
import { useProfileByUsername } from "@/hooks/use-profile";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TooltipProvider, } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Edit, Trash2, Share2, Search, CheckCircle2, AlertCircle, NotebookPen, Plus, BookOpen, Eye, Heart, MessageCircle, MoreHorizontal, Loader2, ListFilter } from "lucide-react";
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

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const getInitials = (profile?: Profile): string => {
  if (!profile) return "U";

  const name = profile.username || profile.firstName || "User";
  return name
    .split(/\s+/)
    .map(n => n[0] || "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
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
  return diffInDays < 7 ? `${diffInDays}d ago` : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const stripHtml = (htmlString: string) => {
  if (!htmlString) return "";
  const plainText = htmlString.replace(/<[^>]*>/g, " ");
  return plainText.replace(/\s\s+/g, " ").trim();
};



const LoadingState = () => (
  <div className="flex justify-center mt-32 bg-gray-100 items-center min-h-[60vh]">
    <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
  </div>
);

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex dark:bg-gray-700/50 mt-32 bg-gray-100 flex-col items-center justify-center min-h-[60vh] text-center px-4"
  >
    <div className="flex flex-col items-center gap-6 p-10 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 w-full max-w-md">
      <div className="p-5 bg-gray-200 dark:bg-gray-700/50 rounded-full">
        <NotebookPen className="w-12 h-12 text-indigo-400 dark:text-indigo-300" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Your Notebook is Empty</h2>
        <p className="text-gray-600 dark:text-gray-400">Let&apos;s create your first note and bring your ideas to life!</p>
      </div>
      <Button
        asChild
        size="lg"
        className="w-full bg-indigo-600 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-600/20 dark:shadow-indigo-500/20"
      >
        <Link href="/dashboard/new">
          <Plus className="w-5 h-5 mr-2" /> Create New Note
        </Link>
      </Button>
    </div>
  </motion.div>
);

const DashboardStats = ({ stats }: { stats: any }) => {
  const statItems = [
    { title: "Total Notes", value: stats?.totalNotes, icon: BookOpen, color: "text-violet-400" },
    { title: "Total Views", value: stats?.totalViews, icon: Eye, color: "text-sky-400" },
    { title: "Total Likes", value: stats?.totalLikes, icon: Heart, color: "text-rose-400" },
    { title: "Total Comments", value: stats?.totalComments, icon: MessageCircle, color: "text-amber-400" },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"
    >
      {statItems.map((item, index) => (
        <motion.div key={item.title} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} transition={{ delay: index * 0.1 }}>
          <Card className="bg-slate-800/50 border-slate-700 hover:border-violet-500/50 transition-colors duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">{item.title}</CardTitle>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-50">{item.value ?? 0}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};

const NoteCard = ({ note, onView, onDelete, onShare }: NoteCardProps) => {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ y: -5 }}
      layout
      exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
      className="group cursor-pointer"
      onClick={() => onView(note)}
    >
      <Card className="bg-slate-800/80 rounded-lg shadow-lg hover:shadow-violet-500/10 border border-slate-700 hover:border-violet-500/50 transition-all duration-300 h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <Avatar className="h-10 w-10 border-2 border-slate-600">
              <AvatarImage src={note.profile?.avatar} alt={note.profile?.username} />
              <AvatarFallback className="bg-slate-700 text-slate-300">{getInitials(note.profile)}</AvatarFallback>
            </Avatar>
            <div className="truncate">
              <p className="text-sm font-semibold text-slate-200 truncate">{note.profile?.username || "Anonymous"}</p>
              <p className="text-xs text-slate-500">{formatRelativeTime(note.updatedAt)}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:bg-slate-700 hover:text-slate-100" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-slate-800 border-slate-700 text-slate-200">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/edit/${note.id}`} className="flex items-center gap-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <Edit className="w-4 h-4 text-slate-400" /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShare(note); }} className="flex items-center gap-2 cursor-pointer">
                <Share2 className="w-4 h-4 text-slate-400" /> Share
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(note.id); }} className="flex items-center gap-2 text-rose-500 focus:text-rose-400 focus:bg-rose-500/10 cursor-pointer">
                <Trash2 className="w-4 h-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="flex-1 py-0">
          <h2 className="text-lg font-bold text-slate-50 group-hover:text-violet-400 transition-colors truncate">
            {note.title}
          </h2>
          <div className="mt-2 text-slate-400 text-sm leading-relaxed line-clamp-3">
            {note.content ? <p>{stripHtml(note.content)}</p> : <p className="italic text-slate-600">No content.</p>}
          </div>
        </CardContent>
        <CardFooter className="pt-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-slate-500 text-xs">
            {[
              { Icon: Heart, value: note.totalLikes },
              { Icon: MessageCircle, value: note.totalComments },
              { Icon: Eye, value: note.totalViews },
            ].map(({ Icon, value }, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <Icon className="w-4 h-4" />
                <span>{value ?? 0}</span>
              </div>
            ))}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

const NoteDetailModal = ({ note, isOpen, onOpenChange }: { note: Note | null; isOpen: boolean; onOpenChange: (open: boolean) => void }) => {
  if (!note) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[90vh] bg-slate-900 border-slate-700 text-slate-50 rounded-lg shadow-2xl p-0 flex flex-col">
        <DialogHeader className="p-6 border-b border-slate-800">
          <DialogTitle className="text-3xl font-bold text-slate-50 line-clamp-2">{note.title}</DialogTitle>
          <DialogDescription className="text-slate-400 mt-1">
            By <span className="font-medium text-violet-400">{note.profile?.username || "Anonymous"}</span> • Last updated {formatRelativeTime(note.updatedAt)}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-8 prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-slate-50 prose-a:text-violet-400 prose-strong:text-slate-200 prose-code:text-rose-400 prose-blockquote:border-violet-500">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {note.content || "*No content provided.*"}
          </ReactMarkdown>
        </div>
      </DialogContent>
    </Dialog>
  );
};


const ShareNoteDialog = ({ note, isOpen, onOpenChange }: { note: Note | null; isOpen: boolean; onOpenChange: (open: boolean) => void }) => {
  const shareMutation = useShareNote();
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ShareFormData>({ resolver: zodResolver(shareSchema) });
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
      <DialogContent className="max-w-md bg-slate-900 border-slate-700 text-slate-50 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Share Note</DialogTitle>
          <DialogDescription className="text-slate-400">Share "{note.title}" with another user.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onShareSubmit)} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="username" className="text-slate-300 mb-2 block">Username</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input
                id="username"
                placeholder="e.g., john.doe"
                className="pl-10 bg-slate-800 border-slate-600 focus:border-violet-500 focus:ring-violet-500"
                {...register("username")}
              />
            </div>
            {errors.username && <p className="text-sm text-rose-500 mt-2">{errors.username.message}</p>}
          </div>
          <div className="min-h-[60px]">
            {isFetchingProfile && (
              <div className="text-sm text-slate-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Searching...</div>
            )}
            {userNotFound && (
              <div className="text-sm text-rose-500 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> User not found.</div>
            )}
            {targetProfile && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-slate-800 border border-slate-700 rounded-md flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={targetProfile.avatar} />
                  <AvatarFallback className="bg-slate-700 text-slate-300">{getInitials(targetProfile)}</AvatarFallback>
                </Avatar>
                <p className="font-medium text-slate-200">{targetProfile.username}</p>
                <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />
              </motion.div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-slate-100">Cancel</Button>
            <Button type="submit" disabled={isShareDisabled} className="bg-violet-600 text-white hover:bg-violet-600/90 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed">
              {shareMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sharing...</> : <><Share2 className="w-4 h-4 mr-2" /> Share Note</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};


export default function NotesListPage() {
  const { data: notes, isLoading: isNotesLoading } = useNotes();
  const { data: stats, isLoading: isStatsLoading } = useDashboardStats();
  const deleteMutation = useDeleteNote();

  const [noteForView, setNoteForView] = useState<Note | null>(null);
  const [noteForShare, setNoteForShare] = useState<Note | null>(null);

  const handleDeleteNote = (id: number) => {
    deleteMutation.mutate(id);
  };

  if (isNotesLoading) {
    return <div className="bg-slate-900"><LoadingState /></div>;
  }

  if (!notes || notes.length === 0) {
    return <div className="bg-slate-900"><EmptyState /></div>;
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="min-h-screen bg-slate-900 text-slate-50 p-6 sm:p-8 md:p-10 space-y-8">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-50">My Notes</h1>
            <p className="text-slate-400 mt-1">{notes.length} note{notes.length !== 1 ? "s" : ""} in your collection</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input placeholder="Search notes..." className="pl-10 w-full sm:w-64 bg-slate-800 border-slate-700 focus:border-violet-500" />
            </div>
            <Button asChild className="bg-violet-600 text-white hover:bg-violet-600/90">
              <Link href="/dashboard/new"><Plus className="w-4 h-4 mr-2" /> New Note</Link>
            </Button>
          </div>
        </header>

        {isStatsLoading ? <div className="w-full h-24 flex justify-center items-center"><Loader2 className="animate-spin text-violet-500" /></div> : <DashboardStats stats={stats} />}

        <motion.div
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          initial="hidden"
          animate="show"
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
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