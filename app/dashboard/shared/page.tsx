"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
// import { useSharedNotes } from "@/hooks/use-note";
import { useAddView } from "@/hooks/use-note-interactions";
import { useMyProfile } from "@/hooks/use-profile";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Share2, Heart, MessageCircle, Eye } from "lucide-react";

import { NoteDetailModal } from "@/components/dashboard/note-detail-modal";

// --- INTERFEISLAR VA YORDAMCHI FUNKSIYALAR ---

interface Profile { id: number; username?: string; avatar?: string; firstName?: string; lastName?: string; }
interface Note { id: number; title: string; content: string; createdAt: string | Date; updatedAt: string | Date; profile: Profile; views: { profile_id: number; }[]; likes: { profile: { id: number; }; }[]; }

const getInitials = (profile: Profile) => {
  const initials = (profile.firstName?.charAt(0) || '') + (profile.lastName?.charAt(0) || '');
  if (initials) return initials.toUpperCase();
  if (profile.username) return profile.username.slice(0, 2).toUpperCase();
  return "U";
};

const formatDate = (date: string | Date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const stripHtml = (htmlString: string) => {
  if (!htmlString) return "";
  const doc = new DOMParser().parseFromString(htmlString, 'text/html');
  return doc.body.textContent || "";
};

export default function SharedNotesPage() {
  // const { data: sharedNotes, isLoading } = useSharedNotes();
  const { data: myProfile } = useMyProfile();
  const [selectedNote, setSelectedNote] = useState<Note | any>(null);
  const currentProfileId = myProfile?.profile?.id;

  const addViewMutation = useAddView(selectedNote?.id as number);

  useEffect(() => {
    if (selectedNote?.id) {
      addViewMutation.mutate();
    }
  }, [selectedNote?.id,]);

  const handleToggleLike = useCallback((noteId: number) => {
    // Since NoteDetailModal has its own toggleLike, but to update the list, we can refetch or optimistically update
    // For simplicity, refetch shared notes after like in modal's onSuccess if needed, but since modal handles it internally, assume it's fine.
    // If need to update list, pass a refetch prop or something, but for now, keep as is.
  }, []);

  const handleCloseModal = () => {
    setSelectedNote(null);
  };
  let isLoading = true;
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 sm:p-8 md:p-10 space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-violet-100 dark:bg-violet-500/10">
            <Share2 className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Shared with me</h1>
            {/* <p className="text-slate-500 dark:text-slate-400">{sharedNotes?.length || 0} note shared</p> */}
          </div>
        </motion.div>

        {/* {!sharedNotes || sharedNotes.length === 0 ? (
          <div className="text-center py-20 px-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg mt-6">
            <Share2 className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
            <h3 className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-300">Hali ulashilgan eslatmalar yo'q</h3>
            <p className="mt-1 text-sm text-slate-500">Boshqalar siz bilan eslatma ulashganda, ular shu yerda paydo bo'ladi.</p>
          </div>
        ) : (
          <motion.div
            initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }}
            className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {sharedNotes.map((note) => (
              <motion.div key={note.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="h-full">
                <Card className="h-full flex flex-col bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-500/50 transition-colors cursor-pointer rounded-xl sm:rounded-2xl"
                  onClick={() => setSelectedNote(note)}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-slate-200 dark:border-slate-600">
                        <AvatarImage src={note.profile.avatar} />
                        <AvatarFallback className="bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">{getInitials(note.profile)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">Shared: {note.profile.username}</CardTitle>
                        <CardDescription className="text-xs text-slate-500 dark:text-slate-500">{formatDate(note.updatedAt)}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2 truncate">{note.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 sm:line-clamp-4">{stripHtml(note.content) || "Mazmun yo'q."}</p>
                  </CardContent>
                  <CardFooter className="border-t border-slate-200 dark:border-slate-700/50 pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" /> {note.likes.length}</span>
                      <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /> {note.comments?.length || 0}</span>
                      <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {note.views.length}</span>
                    </div>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); setSelectedNote(note); }} className="bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-600 dark:text-white dark:hover:bg-violet-500">
                      view
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )} */}
      </div>

      {selectedNote && (
        <NoteDetailModal
          note={selectedNote}
          isOpen={!!selectedNote}
          onClose={handleCloseModal}
          currentProfileId={currentProfileId}
          onToggleLike={handleToggleLike}
        />
      )}
    </DashboardLayout>
  );
}