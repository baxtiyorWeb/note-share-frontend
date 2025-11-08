"use client";

import { motion } from "framer-motion";
import { Eye, Heart, MessageCircle, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import type { Note } from "@/services/notes-service";
import { Profile } from "@/types";

const getInitials = (profile?: Profile): string => {
  if (!profile) return "U";
  const name = profile.username || profile.firstName || "User";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};

const formatRelativeTime = (dateString?: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInSeconds / 3600);
  if (diffInHours < 24) return `${diffInHours}h`;
  const diffInDays = Math.floor(diffInSeconds / 86400);
  if (diffInDays < 7) return `${diffInDays}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const stripHtml = (htmlString: string): string => {
  if (typeof window === "undefined") return "Eslatma mazmuni...";
  try {
    const text = new DOMParser().parseFromString(htmlString, "text/html").body.textContent || "";
    return text.length > 200 ? text.slice(0, 200) + "..." : text;
  } catch {
    return "Eslatma mazmuni...";
  }
};

interface CompactNoteCardProps {
  note: Note;
  currentProfileId?: number;
  onToggleLike: (noteId: number) => void;
  onOpenDetail: (note: Note) => void;
  onDelete?: (id: number) => void;
}

export const CompactNoteCard = ({
  note,
  currentProfileId,
  onToggleLike,
  onOpenDetail,
  onDelete,
}: CompactNoteCardProps) => {
  const author = note.profile;
  const isLiked = note.likes?.some(like => {
    const likeProfileId = like?.profile?.id || like?.profileId;
    return likeProfileId === currentProfileId;
  }) || false;

  const likesCount = note.totalLikes ?? note.likes?.length ?? 0;
  const commentsCount = note.totalComments ?? note.comments?.length ?? 0;
  const viewsCount = note.totalViews ?? note.views?.length ?? 0;

  // Get top 3 commenters/viewers for avatar stack
  const topCommenters = (note.comments || []).slice(0, 3).map((c, i) => ({
    id: i,
    avatar: c.profile?.avatar,
    username: c.profile?.username || "User",
    initials: getInitials(c.profile),
  }));

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 12 } }
      }}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, y: 20 }}
      className="group"
    >
      <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={author?.avatar || undefined} alt={author?.username} />
              <AvatarFallback className="text-xs font-semibold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400">
                {getInitials(author)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-slate-900 dark:text-slate-50 truncate">
                {author?.username || "Noma'lum"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatRelativeTime(note.updatedAt)}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full flex-shrink-0 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/edit/${note.id}`} className="cursor-pointer">
                  Tahrirlash
                </Link>
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(note.id)}
                  className="text-red-500 focus:text-red-500 cursor-pointer"
                >
                  O'chirish
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <div
          className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          onClick={() => onOpenDetail(note)}
        >
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-50 mb-2 line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
            {note.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {stripHtml(note.content) || "Mazmun mavjud emas."}
          </p>
        </div>

        {/* Footer with Stats and Actions */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700/50 space-y-2.5">

          {/* Reaction Buttons */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              {/* Likes */}
              <motion.button
                onClick={() => onToggleLike(note.id)}
                whileTap={{ scale: 0.9 }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-colors ${isLiked
                  ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
                <span className="font-medium text-xs">{likesCount}</span>
              </motion.button>

              {/* Comments */}
              <button className="flex items-center gap-1 px-2.5 py-1 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="font-medium text-xs">{commentsCount}</span>
              </button>

              {/* Views */}
              <button className="flex items-center gap-1 px-2.5 py-1 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <Eye className="w-3.5 h-3.5" />
                <span className="font-medium text-xs">{viewsCount}</span>
              </button>
            </div>
          </div>

          {/* Comments/Views Section - LinkedIn Style */}
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/30 rounded-lg p-2.5">
            {/* Avatars Stack */}
            <div className="flex items-center gap-1.5">
              {topCommenters.length > 0 && (
                <div className="flex -space-x-2">
                  {topCommenters.map((commenter) => (
                    <Avatar
                      key={commenter.id}
                      className="h-6 w-6 border-2 border-white dark:border-slate-700"
                    >
                      <AvatarImage src={commenter.avatar || undefined} alt={commenter.username} />
                      <AvatarFallback className="text-xs bg-violet-500 dark:bg-violet-600 text-white">
                        {commenter.initials}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              )}

              {commentsCount > 0 && (
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  {commentsCount} {commentsCount === 1 ? "izoh" : "izohlar"}
                </span>
              )}

              {commentsCount === 0 && viewsCount > 0 && (
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {viewsCount} {viewsCount === 1 ? "ko'rish" : "ko'rishlar"}
                </span>
              )}
            </div>

            <button
              onClick={() => onOpenDetail(note)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              write a comment
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};