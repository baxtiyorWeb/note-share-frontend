"use client";

import { motion, Variants } from "framer-motion";
import { Bookmark, Globe, Loader2 } from "lucide-react";
import { MinimalNoteCard } from "@/components/dashboard/note-card";
import { NoteDetailModal } from "@/components/dashboard/note-detail-modal";
import { useSavedNotes, useDeleteNote } from "@/hooks/use-note";
import { useMyProfile } from "@/hooks/use-profile";
import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300 } },
};

export default function SavedNotesPage() {
  const { data: savedNotes, isLoading } = useSavedNotes();
  const { data: myProfile } = useMyProfile();
  const currentUserId = myProfile?.profile?.id;

  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const deleteNote = useDeleteNote();

  const openNote = (note: any) => {
    setSelectedNote(note);
    setModalOpen(true);
  };

  const handleDelete = (noteId: number) => {
    deleteNote.mutate(noteId, {
      onSuccess: () => {
        toast.success("Note deleted from saved");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 dark:from-slate-950 dark:via-slate-900 dark:to-amber-950/20">
        <motion.div
          className="max-w-7xl mx-auto px-4 py-12 space-y-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Bookmark className="h-10 w-10 text-amber-500" />
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
                Saved Notes
              </h1>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Your personal collection of knowledge gems. Revisit, reflect, and grow.
            </p>
          </motion.div>

          {/* Notes Grid */}
          {savedNotes && savedNotes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {savedNotes.map((note) => (
                <motion.div
                  key={note.id}
                  variants={itemVariants}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="group"
                >
                  <MinimalNoteCard
                    note={note}
                    currentProfileId={currentUserId}
                    onToggleLike={() => { }}
                    onOpenDetail={openNote}
                    onDelete={handleDelete}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              variants={itemVariants}
              className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-amber-300 dark:border-amber-800"
            >
              <Bookmark className="h-16 w-16 text-amber-500 mx-auto mb-4 opacity-70" />
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                No saved notes yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                Start exploring and tap the bookmark icon on notes you want to keep.
              </p>
              <Button asChild className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                <Link href="/dashboard/explore">
                  <Globe className="w-5 h-5 mr-2" />
                  Explore Notes
                </Link>
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Modal */}
        <NoteDetailModal
          note={selectedNote}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          currentProfileId={currentUserId}
          onToggleLike={() => { }}
        />
      </div>
    </DashboardLayout>
  );
}