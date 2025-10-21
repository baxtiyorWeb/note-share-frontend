"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, Variant, Variants } from "framer-motion";
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
import { TooltipProvider } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Edit, Trash2, Share2, Search, CheckCircle2, AlertCircle, NotebookPen, Plus, BookOpen, Eye, Heart, MessageCircle, MoreHorizontal, Loader2, ListFilter, TrendingUp, TrendingDown, ChevronUp, ChevronDown } from "lucide-react";

// --- Interfaces ---

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

// --- Hooks and Utilities ---

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
  <div className="flex justify-center items-center min-h-[60vh] bg-gray-50 dark:bg-gray-900">
    <Loader2 className="w-12 h-12 text-indigo-500 dark:text-indigo-400 animate-spin" />
  </div>
);

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 bg-gray-50 dark:bg-gray-900"
  >
    <div className="flex flex-col items-center gap-6 p-10 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 w-full max-w-md">
      <div className="p-5 bg-gray-100 dark:bg-gray-700 rounded-full">
        <NotebookPen className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Your Notebook is Empty</h2>
        <p className="text-gray-600 dark:text-gray-300">Let&apos;s create your first note and bring your ideas to life!</p>
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

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const DashboardStats = ({ stats }: { stats: any }) => {
  const statItems = [
    { title: "Notes", value: stats?.totalNotes, trend: 12.5, icon: BookOpen, color: "text-indigo-500 dark:text-violet-400", bgColor: "bg-indigo-500/10 dark:bg-violet-500/10", border: "border-indigo-200 dark:border-violet-600/50", shadow: "shadow-indigo-300/30 dark:shadow-violet-800/20" },
    { title: "Views", value: stats?.totalViews, trend: 5.8, icon: Eye, color: "text-sky-500 dark:text-cyan-400", bgColor: "bg-sky-500/10 dark:bg-cyan-500/10", border: "border-sky-200 dark:border-cyan-600/50", shadow: "shadow-sky-300/30 dark:shadow-cyan-800/20" },
    { title: "Likes", value: stats?.totalLikes, trend: -3.2, icon: Heart, color: "text-rose-500 dark:text-rose-400", bgColor: "bg-rose-500/10 dark:bg-rose-500/10", border: "border-rose-200 dark:border-rose-600/50", shadow: "shadow-rose-300/30 dark:shadow-rose-800/20" },
    { title: "Comments", value: stats?.totalComments, trend: 8.9, icon: MessageCircle, color: "text-amber-500 dark:text-amber-400", bgColor: "bg-amber-500/10 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-600/50", shadow: "shadow-amber-300/30 dark:shadow-amber-800/20" },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      // Mobil uchun 2 qator, katta ekranlar uchun 4 qator
      className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
    >
      {statItems.map((item, index) => {
        const isPositive = item.trend >= 0;
        const TrendIcon = isPositive ? ChevronUp : ChevronDown;
        const trendColor = isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
        const trendValue = Math.abs(item.trend).toFixed(1);

        return (
          <motion.div
            key={item.title}
            variants={itemVariants}
            transition={{ delay: index * 0.1 }}
            className="col-span-1"
          >
            <Card
              // Padding p-4 ga kichraytirildi. Light/Dark fon berildi
              className={`p-4 rounded-xl bg-white dark:bg-slate-900 border ${item.border}
                           transition-all duration-500 h-full cursor-pointer
                           shadow-lg hover:shadow-xl hover:shadow-lg dark:hover:shadow-2xl
                           hover:${item.shadow} transform hover:-translate-y-1`}
            >

              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <div className="text-2xl font-extrabold text-gray-900 dark:text-slate-50">
                    {item.value ? item.value.toLocaleString() : 0}
                  </div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-slate-400 mt-0.5">{item.title}</p>
                </div>

                <div className={`p-2 rounded-lg ${item.bgColor}`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center">
                <div className={`flex items-center text-sm font-bold ${trendColor}`}>
                  <TrendIcon className="w-4 h-4 mr-1" />
                  <span>{isPositive ? '+' : '-'}{trendValue}%</span>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
};
const NoteCard = ({ note, onView, onDelete, onShare }: NoteCardProps) => {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ y: -3, scale: 1.01 }} // Engil hover effekt
      layout
      exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
      className="group cursor-pointer"
      onClick={() => onView(note)}
    >
      <Card className="bg-white dark:bg-slate-900 rounded-xl shadow-lg hover:shadow-xl hover:shadow-indigo-500/20 dark:hover:shadow-violet-400/10 border border-gray-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-violet-600 transition-all duration-300 h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between gap-4 p-4 pb-3"> {/* Padding ixchamlashtirildi */}
          <div className="flex items-center gap-3 overflow-hidden">
            <Avatar className="h-9 w-9 border border-gray-300 dark:border-slate-700"> {/* Kichikroq Avatar */}
              <AvatarImage src={note.profile?.avatar} alt={note.profile?.username} />
              <AvatarFallback className="bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-sm">{getInitials(note.profile)}</AvatarFallback>
            </Avatar>
            <div className="truncate">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{note.profile?.username || "Anonymous"}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">{formatRelativeTime(note.updatedAt)}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            {/* ... DropdownMenuContent o'zgarishsiz qoladi ... */}
            <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100">
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/edit/${note.id}`}
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Edit className="w-4 h-4 text-gray-500 dark:text-slate-400" /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onShare(note); }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-gray-500 dark:text-slate-400" /> Share
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200 dark:bg-slate-700" />
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
                className="flex items-center gap-2 text-rose-500 dark:text-rose-400 focus:text-rose-600 dark:focus:text-rose-300 focus:bg-rose-500/10 dark:focus:bg-rose-400/10 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="flex-1 px-4 py-0"> {/* Padding ixchamlashtirildi */}
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50 group-hover:text-indigo-600 dark:group-hover:text-violet-400 transition-colors truncate">
            {note.title}
          </h2>
          <div className="mt-2 text-gray-600 dark:text-slate-300 text-sm leading-relaxed line-clamp-3">
            {note.content ? <p>{stripHtml(note.content)}</p> : <p className="italic text-gray-500 dark:text-slate-400">No content.</p>}
          </div>
        </CardContent>

        <CardFooter className="pt-3 pb-4 px-4 flex items-center justify-between"> {/* Padding ixchamlashtirildi */}
          <div className="flex items-center gap-4 text-gray-500 dark:text-slate-400 text-xs">
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
      <DialogContent className="p-1 sm:max-w-[950px] max-h-[90vh] overflow-hidden rounded-xl">
        <DialogHeader className="p-6 border-b border-gray-200 dark:border-gray-800">
          <DialogTitle className="text-3xl font-bold text-gray-900 dark:text-gray-50 line-clamp-2">{note.title}</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400 mt-1">
            By <span className="font-medium text-indigo-500 dark:text-indigo-400">{note.profile?.username || "Anonymous"}</span> • Last updated{" "}
            {formatRelativeTime(note.updatedAt)}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-8 prose dark:prose-invert max-w-none prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-headings:text-gray-900 dark:prose-headings:text-gray-50 prose-a:text-indigo-500 dark:prose-a:text-indigo-400 prose-strong:text-gray-900 dark:prose-strong:text-gray-200 prose-code:text-rose-500 dark:prose-code:text-rose-400 prose-blockquote:border-indigo-500 dark:prose-blockquote:border-indigo-400">
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
    shareMutation.mutate(
      { noteId: note.id, targetProfileId: targetProfile.id },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      }
    );
  };

  if (!note) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) reset(); onOpenChange(open); }}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-50 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-50">Share Note</DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">Share "{note.title}" with another user.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onShareSubmit)} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="username" className="text-gray-700 dark:text-gray-300 mb-2 block">Username</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
              <Input
                id="username"
                placeholder="e.g., john.doe"
                className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                {...register("username")}
              />
            </div>
            {errors.username && <p className="text-sm text-rose-500 dark:text-rose-400 mt-2">{errors.username.message}</p>}
          </div>
          <div className="min-h-[60px]">
            {isFetchingProfile && (
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Searching...
              </div>
            )}
            {userNotFound && (
              <div className="text-sm text-rose-500 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> User not found.
              </div>
            )}
            {targetProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md flex items-center gap-3"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={targetProfile.avatar} />
                  <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{getInitials(targetProfile)}</AvatarFallback>
                </Avatar>
                <p className="font-medium text-gray-900 dark:text-gray-200">{targetProfile.username}</p>
                <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400 ml-auto" />
              </motion.div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isShareDisabled}
              className="bg-indigo-600 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {shareMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Sharing...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" /> Share Note
                </>
              )}
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
  // Add state for search term and filter/sort
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const handleDeleteNote = (id: number) => {
    deleteMutation.mutate(id);
  };

  const filteredNotes = React.useMemo(() => {
    if (!notes) return [];
    if (!debouncedSearchTerm) return notes;

    const lowerCaseSearchTerm = debouncedSearchTerm.toLowerCase();

    return notes.filter(note =>
      note.title.toLowerCase().includes(lowerCaseSearchTerm) ||
      stripHtml(note.content).toLowerCase().includes(lowerCaseSearchTerm) ||
      note.profile?.username?.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [notes, debouncedSearchTerm]);

  if (isNotesLoading) {
    return <div className="bg-gray-50 dark:bg-gray-900"><LoadingState /></div>;
  }

  if (!notes || notes.length === 0) {
    return <div className="bg-gray-50 dark:bg-gray-900"><EmptyState /></div>;
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50 p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8 max-w-[1500px] mx-auto"> {/* Global padding kamaytirildi */}

        {/* 1. Header Section - Mobile va Desktopda moslashuvchan */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

          {/* Sarlavha qismi */}
          <div className="flex-shrink-0">
            {/* Kichik ekranlarda kichikroq, katta ekranlarda katta sarlavha */}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-50">My Notes</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">{notes.length} note{notes.length !== 1 ? "s" : ""} in your collection</p>
          </div>

          {/* Qidiruv va Tugmalar (Bir qatorga joylashtirildi) */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" /> {/* Kichikroq ikon */}
              <Input
                placeholder="Search notes..."
                // Mobil/desktop kengligi: mobil telefonlarda to'liq ekran, desktopda 64
                className="pl-9 w-full md:w-64 h-10 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-violet-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter/Sort Button (Mobil uchun ham to'g'ri o'lchamda) */}
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 flex-shrink-0 border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              <ListFilter className="w-5 h-5 text-gray-500 dark:text-slate-400" />
            </Button>

            {/* New Note Button (Mobil/Desktop matnni ko'rsatishi/yashirishi) */}
            <Button asChild className="h-10 px-4 bg-indigo-600 text-white dark:bg-violet-500 dark:hover:bg-violet-600 hover:bg-indigo-700 flex-shrink-0">
              <Link href="/dashboard/new">
                <Plus className="w-4 h-4 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">New Note</span>
              </Link>
            </Button>
          </div>
        </header>

        {/* 2. Dashboard Stats Section (Avvalgi qadamda to'liq responsive qilingan) */}
        {isStatsLoading ? (
          <div className="w-full h-20 flex justify-center items-center">
            <Loader2 className="animate-spin text-indigo-500 dark:text-violet-400" />
          </div>
        ) : (
          // DashboardStats komponenti (grid-cols-2 / md:grid-cols-4) ishlashi uchun to'g'ri qo'shiladi
          <DashboardStats stats={stats} />
        )}

        {/* 3. Note Cards Section (Responsive Grid) */}
        {filteredNotes.length === 0 && notes.length > 0 && debouncedSearchTerm ? (
          <div className="text-center py-10 text-gray-600 dark:text-gray-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-3 text-yellow-500" />
            <p className="text-lg font-semibold">No notes found for "{searchTerm}".</p>
            <p>Try refining your search terms.</p>
          </div>
        ) : (
          <motion.div
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
            initial="hidden"
            animate="show"
            // Grid layout: mobil 1 qator, kichik tablet 2 qator, desktop 3/4 qator
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <AnimatePresence>
              {filteredNotes.map((note) => (
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
        )}

      </div>

      {/* Modallar */}
      <NoteDetailModal note={noteForView} isOpen={!!noteForView} onOpenChange={() => setNoteForView(null)} />
      <ShareNoteDialog note={noteForShare} isOpen={!!noteForShare} onOpenChange={() => setNoteForShare(null)} />
    </TooltipProvider>
  );
}