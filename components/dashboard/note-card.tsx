"use client";

import { motion } from "framer-motion";
import { MoreHorizontal, MessageCircle, Heart, View, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Note } from "@/services/notes-service";
import type { Profile } from "@/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const getInitials = (profile?: Profile) =>
  profile?.username?.slice(0, 2).toUpperCase() || "U";

const stripHtml = (html: string): string => {
  if (typeof window === "undefined") return "";
  const text = new DOMParser().parseFromString(html, "text/html").body.textContent || "";
  return text.length > 140 ? text.slice(0, 140) + "…" : text;
};

export const MinimalNoteCard = ({
  note,
  currentProfileId,
  onToggleLike,
  onOpenDetail,
  onDelete,
}: {
  note: Note;
  currentProfileId?: number;
  onToggleLike: (id: number) => void;
  onOpenDetail: (note: Note) => void;
  onDelete?: (id: number) => void;
}) => {
  const author = note.profile;
  const isLiked = note.likes?.some(
    (l) => (l?.profile?.id || l?.profile?.id) === currentProfileId
  );

  const likes = note.totalLikes ?? note.likes?.length ?? 0;
  const comments = note.totalComments ?? note.comments?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="w-full"
    >
      <Card className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
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
                3d {/* vaqtni bu joyda formatRelativeTime() bilan o‘zgartir */}
              </p>
            </div>
          </div>
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
        </div>

        {/* Body */}
        <div
          className="text-sm text-slate-700 dark:text-slate-300 mb-3 line-clamp-3"
          onClick={() => onOpenDetail(note)}
        >
          {stripHtml(note.content) || "Mazmun mavjud emas."}
        </div>

        {/* Footer (actions) */}
        <div className="flex items-center justify-between mt-2 border-t border-slate-100 dark:border-slate-700 pt-2">
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-xs">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike(note.id);
              }}
              className={`flex items-center gap-1 hover:text-red-500 ${isLiked ? "text-red-500" : ""
                }`}
            >
              <Heart className="w-4 h-4" />
              <span>{likes}</span>
            </button>
            <button
              onClick={() => onOpenDetail(note)}
              className="flex items-center gap-1 hover:text-blue-500"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{comments}</span>
            </button>
            <button
              onClick={() => onOpenDetail(note)}
              className="flex items-center gap-1 hover:text-blue-500"
            >
              <Eye className="w-4 h-4" />
              <span>{note.views?.length}</span>
            </button>
          </div>

          {/* Replies */}
          {comments > 0 && (
            <div className="flex items-center gap-2 bg-purple-100 px-2 py-1 rounded-md">
              <div className="flex -space-x-2">
                {note.comments?.slice(0, 3).map((c, i) => (
                  <Avatar
                    key={i}
                    className="h-5 w-5 border-2 border-white dark:border-slate-800"
                  >
                    <AvatarImage src={c?.profile?.avatar || undefined} />
                    <AvatarFallback className="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {getInitials(c.profile)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <button
                onClick={() => onOpenDetail(note)}
                className="text-violet-500 hover:text-violet-600 font-semibold text-xs"
              >
                {comments} replies
              </button>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
