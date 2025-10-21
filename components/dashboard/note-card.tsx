"use client";

import { motion } from "framer-motion";
import {
  MoreHorizontal,
  MessageCircle,
  Heart,
  Eye,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Note } from "@/services/notes-service";
import type { Profile } from "@/types";
import { formatRelativeTime } from "@/utils/utils";

const getInitials = (profile?: Profile): string => {
  if (!profile) return "AN";
  const nameInitial = profile.firstName?.charAt(0) || "";
  const surnameInitial = profile.lastName?.charAt(0) || "";
  const initials = (nameInitial + surnameInitial || profile.username?.slice(0, 2) || "AN").toUpperCase();
  return initials;
};

const stripHtml = (html: string): string => {
  if (typeof window === "undefined") return "";
  const text = new DOMParser().parseFromString(html, "text/html").body.textContent || "";
  return text.length > 140 ? `${text.slice(0, 140)}…` : text;
};

interface MinimalNoteCardProps {
  note: Note;
  currentProfileId?: number;
  onToggleLike: (id: number) => void;
  onOpenDetail: (note: Note) => void;
  onDelete?: (id: number) => void;
}

export const MinimalNoteCard: React.FC<MinimalNoteCardProps> = ({
  note,
  currentProfileId,
  onToggleLike,
  onOpenDetail,
  onDelete,
}) => {
  const author = note.profile;
  const isLiked = note.likes?.some((like) => like.profile?.id === currentProfileId) ?? false;
  const likesCount = note.totalLikes ?? note.likes?.length ?? 0;
  const commentsCount = note.totalComments ?? note.comments?.length ?? 0;
  const viewsCount = note.views?.length ?? 0;


  const renderAuthorInfo = () => (
    <div className="flex items-center gap-3">
      <Avatar className="h-9 w-9">
        <AvatarImage src={author?.avatar || undefined} />
        <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-slate-700 dark:text-slate-300 font-semibold">
          {getInitials(author)}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-none">
          {author?.username || "Anonymous"}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {formatRelativeTime(note.createdAt)}
        </p>
      </div>
    </div>
  );

  const renderActions = () => (
    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-xs">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleLike(note.id);
        }}
        className={`flex items-center gap-1 hover:text-red-500 ${isLiked ? "text-red-500" : ""}`}
      >
        <Heart className="w-4 h-4" />
        <span>{likesCount}</span>
      </button>
      <button
        onClick={() => onOpenDetail(note)}
        className="flex items-center gap-1 hover:text-blue-500"
      >
        <MessageCircle className="w-4 h-4" />
        <span>{commentsCount}</span>
      </button>
      <button
        onClick={() => onOpenDetail(note)}
        className="flex items-center gap-1 hover:text-blue-500"
      >
        <Eye className="w-4 h-4" />
        <span>{viewsCount}</span>
      </button>
    </div>
  );

  const renderCommentAvatars = () => {
    if (commentsCount === 0) return null;

    const visibleComments = note.comments?.slice(0, 3) ?? [];

    return (
      <div className="flex items-center gap-2 bg-purple-100/70 dark:bg-slate-800/50 px-2 py-1 rounded-md">
        <div className="flex -space-x-2">
          {visibleComments.map((comment, index) => {
            const author = comment.author;
            const username = author?.username || "User";
            const initials = username.charAt(0).toUpperCase();

            return (
              <Avatar
                key={index}
                className="h-5 w-5 border-2 border-white dark:border-slate-800 shadow-sm"
              >
                <AvatarImage src={author?.avatar || undefined} />
                <AvatarFallback className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  {initials}
                </AvatarFallback>
              </Avatar>
            );
          })}
        </div>
        <button
          onClick={() => onOpenDetail(note)}
          className="text-violet-600 dark:text-violet-400 hover:text-violet-700 font-semibold text-xs"
        >
          {commentsCount} ta izoh
        </button>
      </div>
    );
  };

  const renderDropdownMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="w-4 h-4 text-slate-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 text-xs">
        <DropdownMenuItem
          onClick={() => onOpenDetail(note)}
          className="cursor-pointer"
        >
          Ko‘rish
        </DropdownMenuItem>
        {onDelete && (
          <DropdownMenuItem
            onClick={() => onDelete(note.id)}
            className="text-red-500 focus:text-red-500"
          >
            O‘chirish
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="w-full"
    >
      <Card
        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
        onClick={() => onOpenDetail(note)}
      >
        <div className="flex items-center justify-between mb-2">
          {renderAuthorInfo()}
          {renderDropdownMenu()}
        </div>

        <div
          className="text-sm text-slate-700 dark:text-slate-300 mb-3 line-clamp-3"
        >
          {stripHtml(note.content) || "Mazmun mavjud emas."}
        </div>

        <div className="flex items-center justify-between mt-2 border-t border-slate-100 dark:border-slate-700 pt-2">
          {renderActions()}
          {renderCommentAvatars()}
        </div>
      </Card>
    </motion.div>
  );
};