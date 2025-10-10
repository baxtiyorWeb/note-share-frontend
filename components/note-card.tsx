// 📁 app/dashboard/notes/components/NoteCard.tsx
import { motion } from "framer-motion";
import { Share2, Eye, Heart, MessageCircle, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Note, Profile } from "../types";

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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface NoteCardProps {
  note: Note;
  onView: (note: Note) => void;
  onDelete: (id: number) => void;
  onShare: (note: Note) => void;
}

export function NoteCard({ note, onView, onDelete, onShare }: NoteCardProps) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      layout
      exit={{ opacity: 0, y: 20 }}
      className="group"
    >
      <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 border h-full flex flex-col">
        <div className="p-5 flex items-center justify-between gap-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={note.profile?.avatar} alt={note.profile?.username} />
              <AvatarFallback>{getInitials(note.profile)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-slate-800">{note.profile?.username || "Anonymous"}</p>
              <p className="text-xs text-slate-500">{formatRelativeTime(note.updatedAt)}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild><Link href={`/dashboard/edit/${note.id}`} className="w-full">Edit</Link></DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(note.id)} className="text-red-500">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="p-5 flex-1 cursor-pointer" onClick={() => onView(note)}>
          <h2 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600">{note.title}</h2>
          <p className="text-sm text-slate-600 mt-2 line-clamp-3">{note.content || "No content."}</p>
        </div>

        <div className="px-5 py-3 border-t flex items-center justify-between">
          <div className="flex items-center gap-4 text-slate-500">
            {[
              { icon: Heart, value: note.totalLikes, color: "hover:text-rose-500", tooltip: "Likes" },
              { icon: MessageCircle, value: note.totalComments, color: "hover:text-emerald-600", tooltip: "Comments" },
              { icon: Eye, value: note.totalViews, color: "hover:text-blue-600", tooltip: "Views" },
            ].map(stat => (
              <Tooltip key={stat.tooltip}>
                <TooltipTrigger asChild>
                  <button className={`flex items-center gap-1.5 transition-colors ${stat.color}`}>
                    <stat.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{stat.value}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent><p>{stat.tooltip}</p></TooltipContent>
              </Tooltip>
            ))}
          </div>
          <Button onClick={() => onShare(note)} variant="ghost" size="icon" className="rounded-full">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}