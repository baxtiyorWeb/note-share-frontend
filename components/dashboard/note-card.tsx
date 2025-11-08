// components/dashboard/note-card.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link"; // Link komponentini import qiling
import {
  MoreHorizontal,
  MessageCircle,
  Heart,
  Eye,
  BookOpen, // Ilm ruhini aks ettirish uchun yangi icon
  Share2,
  Pen, // Qo'shimcha aksiya uchun
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Qo'shimcha UI uchun

import type { Note, Profile } from "@/types"; // Bu type'lar aniq bo'lishi kerak
import { formatRelativeTime } from "@/utils/utils"; // Utils to'g'ri joyda bo'lishi kerak
import toast from "react-hot-toast";

// --- Helper Functions ---
const getInitials = (profile?: Profile): string => {
  if (!profile) return "AN";
  const initials = (profile.firstName?.charAt(0) || "") + (profile.lastName?.charAt(0) || "");
  return (initials || profile.username?.slice(0, 2) || "AN").toUpperCase();
};

const stripHtml = (html: string): string => {
  if (typeof document === "undefined") return ""; // Server-side rendering (SSR) uchun tekshirish
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

// --- Props Interface ---
export interface MinimalNoteCardProps {
  note: Note;
  currentProfileId?: number;
  onToggleLike: (id: number) => void;
  onOpenDetail: (note: Note) => void;
  onDelete: (id: number) => void;
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

  const likesCount = note.likesCount ?? note.likes?.length ?? 0;
  const commentsCount = note.commentsCount ?? note.comments?.length ?? 0;
  const viewsCount = note.viewsCount ?? 0;




  const renderAuthorInfo = () => (
    <Link
      href={`/dashboard/profile/${author?.username}`}
      className="flex items-center gap-3 group transition-colors duration-200"
      onClick={(e) => e.stopPropagation()} // Card ichidagi Link bosilganda Cardning o'zini bosmaslik uchun
    >
      <Avatar className="h-9 w-9 border-2 border-indigo-200 dark:border-slate-600 group-hover:border-indigo-400">
        <AvatarImage src={author?.avatar || undefined} />
        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold group-hover:from-indigo-400 group-hover:to-purple-500 transition-all">
          {getInitials(author)}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {author?.username || "Anonymous"}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {formatRelativeTime(note.createdAt)}
        </p>
      </div>
    </Link>
  );

  // --- Render Actions (Likes, Comments, Views) ---
  const renderActions = () => (
    <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 text-sm">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike(note.id);
              }}
              className={`flex items-center gap-1 p-1 rounded-full hover:bg-red-50 dark:hover:bg-slate-700 transition-all duration-200
                          ${isLiked ? "text-red-500" : "hover:text-red-500"}`}
            >
              <Heart className="w-4 h-4 fill-current" />
              <span className="font-medium">{likesCount}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {isLiked ? "Unlike" : "Like this note"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => { e.stopPropagation(); onOpenDetail(note); }}
              className="flex items-center gap-1 p-1 rounded-full hover:bg-blue-50 dark:hover:bg-slate-700 transition-all duration-200 hover:text-blue-500"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="font-medium">{commentsCount}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            View comments
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-1 p-1"> {/* Views odatda bosilmaydi */}
              <Eye className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <span className="font-medium text-slate-600 dark:text-slate-400">{viewsCount}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            Total views
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  // --- Render Comment Avatars (Yangi, ko'proq vizual) ---
  const renderCommentAvatars = () => {
    if (commentsCount === 0) return null;

    const visibleComments = note.comments?.slice(0, 3) ?? [];

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(note);
              }}
              className="flex flex-col items-center gap-1
               bg-gradient-to-r from-purple-100
               to-indigo-100 dark:from-slate-700/5
                dark:to-slate-800/50 px-3 py-1 rounded-full
                hover:shadow-md transition-all duration-200"
            >
              {/* 💎 Avatars Stack */}
              <div className="flex items-center">
                {visibleComments.map((comment, index) => {
                  const author = comment.author;
                  const initials = getInitials(author);
                  return (
                    <div
                      key={comment.id || index}
                      className={`relative z-[${10 - index}]`}
                      style={{
                        marginLeft: index === 0 ? "0px" : "-10px", // overlap darajasi
                      }}
                    >
                      <Avatar className="h-6 w-6 border-[2px] border-white dark:border-slate-900 shadow-sm">
                        <AvatarImage src={author?.avatar || undefined} />
                        <AvatarFallback className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  );
                })}

                {/* 🔵 Agar 3 dan ortiq bo‘lsa, + belgi bilan ko‘rsatamiz */}
                {note?.comments?.length > 3 && (
                  <div
                    className="h-6 w-6 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 bg-indigo-500 text-white text-[10px] font-semibold shadow-sm"
                    style={{ marginLeft: "-10px" }}
                  >
                    +{note?.comments?.length - 3}
                  </div>
                )}
              </div>

              {/* Izohlar soni */}

            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            Read {commentsCount} comments
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };


  // --- Render Dropdown Menu ---
  const renderDropdownMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          onClick={(e) => e.stopPropagation()} // Dropdownni ochishda cardni bosmaslik uchun
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg">
        <DropdownMenuItem
          onClick={(e) => { e.stopPropagation(); onOpenDetail(note); }}
          className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
        >
          <BookOpen className="w-4 h-4 mr-2" /> view
        </DropdownMenuItem>
        {note.profile?.id === currentProfileId && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/dashboard/edit/${note.id}`;
              toast.success("Note editing opened!");
            }}
            className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
          >
            <Pen className="w-4 h-4 mr-2" /> edit
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={(e) => { e.stopPropagation(); toast.success("Note link copied!"); }} // Misol
          className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
        >
          <Share2 className="w-4 h-4 mr-2" /> share
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          className="text-red-500 focus:text-red-500 dark:focus:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          O‘chirish
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu >
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.1), 0 6px 6px rgba(0,0,0,0.06)" }} // Chiroyli hover soyasi
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="w-full rounded-3xl"
    >
      <Card
        className="relative p-5  rounded-3xl border border-slate-200 dark:border-slate-700
                   bg-white dark:bg-slate-800/80 shadow-lg
                   transition-all duration-300 cursor-pointer overflow-hidden"
        onClick={() => onOpenDetail(note)}
      >
        {/* Yuqori o'ng burchakdagi yaltiroq gradient effekti (ilm ruhini berish uchun) */}
        <div className="absolute -top-10  -right-10 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-200/50 to-purple-200/30 dark:from-indigo-600/20 dark:to-purple-600/10 blur-xl z-0" />

        <div className="relative z-10"> {/* Barcha kontentni z-index orqali yuqoriga chiqarish */}
          <div className="flex items-center justify-between mb-4">
            {renderAuthorInfo()}
            {renderDropdownMenu()}
          </div>

          {note.title && ( // Agar title bo'lsa, uni ko'rsatish
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2 leading-tight">
              {note.title}
            </h3>
          )}

          <div
            className="text-base text-slate-700 dark:text-slate-300 mb-4 line-clamp-3 leading-relaxed"
          >
            {stripHtml(note.content) || (
              <span className="italic text-slate-500 dark:text-slate-400">Mazmun mavjud emas.</span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            {renderActions()}
            {renderCommentAvatars()}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};