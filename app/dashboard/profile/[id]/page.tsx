"use client";

import React, { useState } from "react";
import { motion, Variants } from "framer-motion";
import {
  Loader2,
  MessageCircle,
  UserCheck,
  UserPlus,
  Zap,
  NotebookText,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MinimalNoteCard } from "@/components/dashboard/note-card";
import { NoteDetailModal } from "@/components/dashboard/note-detail-modal";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";
import { useMyProfile, useProfileUserName } from "@/hooks/use-profile";
import {
  useToggleFollow,
  useFollowCounts,
} from "@/hooks/use-follow";
import { Note } from "@/types";
import { useDeleteNote, useNotes } from "@/hooks/use-note";
import { deleteNote } from "@/services/notes-service";



// === Animations ===
const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.05 },
  },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// === Utility ===
const getInitials = (firstName?: string, lastName?: string) =>
  `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();

export default function UserProfilePage() {
  const { id } = useParams();
  const { data: profile, isLoading, error } = useProfileUserName(id as string);

  const { mutate: toggleFollow, isPending } = useToggleFollow();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const { data } = useMyProfile();
  const currentUserId = data?.id as number;

  const { data: followCounts } = useFollowCounts(currentUserId);
  const { data: notes, isLoading: noteLoad, refetch } = useNotes();


  const handleFollowToggle = () => {

    if (!profile?.username) {
      toast.error("User ID not found");
      return;
    }

    toggleFollow(profile?.username, {
      onSuccess: (data) => {
        toast.success(data.message || "Follow status updated");
      },
      onError: (error: any) => {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Something went wrong";
        toast.error(message);
      },
    });
  };

  const handleOpenDetail = (note: Note) => {
    setSelectedNote(note);
    setIsModalOpen(true);
  };

  const handleCloseDetail = () => {
    setSelectedNote(null);
    setIsModalOpen(false);
  };

  const onDelete = (noteId: number) => {
    console.log(noteId);

  }

  const handleNoteAction = (id: number) => {
    // (Optional) Like toggling can be added later
  };

  // === Loading / Error States ===
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !profile) {
    return (
      <DashboardLayout>
        <div className="text-center p-10 bg-white dark:bg-slate-900 rounded-xl shadow-lg m-auto max-w-lg mt-10">
          <h2 className="text-2xl font-bold text-red-500 mb-3">
            Something went wrong
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            The user @{id} could not be found or failed to load data.
          </p>
          <Button
            onClick={() => window.history.back()}
            className="mt-6 bg-violet-600 hover:bg-violet-700"
          >
            Go Back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // === Profile data ===
  const isCurrentlyFollowing = profile?.isFollowing || false;


  return (
    <DashboardLayout>
      <motion.div
        className="w-full max-w-full mx-auto px-2 md:px-0"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* === Profile Header === */}
        <motion.div
          variants={itemVariants}
          className="relative bg-white dark:bg-slate-900 shadow-xl rounded-xl overflow-hidden mb-8"
        >
          {/* Cover Image */}
          <div className="relative h-56 bg-violet-600/10 dark:bg-slate-800/50">
            {profile?.coverImage ? (
              <img
                src={profile.coverImage}
                alt={`${profile.username} cover`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-violet-400 dark:text-violet-600">
                <Zap className="h-10 w-10" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-slate-900/10 to-transparent"></div>
          </div>

          {/* Avatar & Info */}
          <div className="p-6 pt-0 flex flex-col md:flex-row md:items-end justify-between">
            <div className="flex items-start gap-4 -mt-16 sm:-mt-20">
              <Avatar className="h-32 w-32 ring-4 ring-white dark:ring-slate-900 border-4 border-violet-500/50 shadow-2xl">
                <AvatarImage src={profile?.avatar || undefined} />
                <AvatarFallback className="text-4xl font-extrabold bg-violet-600 text-white">
                  {getInitials(profile?.firstName, profile?.lastName)}
                </AvatarFallback>
              </Avatar>

              <div className="pt-20 sm:pt-24">
                <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-50 leading-tight">
                  {profile?.firstName} {profile?.lastName}
                </h1>
                <p className="text-xl text-violet-600 dark:text-violet-400 font-semibold mt-1">
                  @{profile?.username}
                </p>
              </div>
            </div>

            <div className="mt-4 md:mt-0 flex gap-3 flex-shrink-0">
              <Button
                variant="outline"
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
              >
                <MessageCircle className="h-4 w-4 mr-2" /> Message
              </Button>

              <Button
                onClick={handleFollowToggle}
                disabled={isPending}
                className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : isCurrentlyFollowing ? (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" /> Following
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" /> Follow
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Bio & Stats */}
          <div className="px-6 pb-6 pt-3">
            <p className="text-slate-700 dark:text-slate-300 italic mb-6 border-l-4 border-violet-400 pl-3">
              {profile?.bio || "This user hasn’t added a bio yet."}
            </p>

            <div className="flex gap-8 text-base">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <NotebookText className="h-5 w-5 text-violet-500" />
                <span className="font-bold">{profile?.notesCount ?? 0}</span>
                <span className="text-slate-500 dark:text-slate-400">Notes</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <UserCheck className="h-5 w-5 text-violet-500" />
                <span className="font-bold">
                  {followCounts?.followersCount ?? 0}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Followers
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <UserPlus className="h-5 w-5 text-violet-500" />
                <span className="font-bold">
                  {followCounts?.followingCount ?? 0}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Following
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <Separator className="my-10 dark:bg-slate-700 max-w-4xl mx-auto" />

        {/* === Notes === */}
        <motion.div variants={itemVariants} className="p-4 md:p-0">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-8 flex items-center gap-3">
            <NotebookText className="h-6 w-6 text-violet-600" />
            @{profile?.username}'s Notes
          </h2>

          <div className="max-w-full grid grid-cols-4 gap-4 mx-auto">
            {notes!.length > 0 ? (
              notes?.map((note: Note) => (
                <motion.div
                  key={note.id}
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                  className="group"
                >
                  <MinimalNoteCard
                    note={note}
                    currentProfileId={currentUserId}
                    onToggleLike={handleNoteAction}
                    onOpenDetail={handleOpenDetail}
                    onDelete={() => onDelete(note.id)}
                  />
                </motion.div>
              ))

            ) : (
              <div className="text-center py-20 text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg col-span-4">
                <p>This user hasn’t posted any notes yet. 😔</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>


      {selectedNote && (
        <NoteDetailModal
          note={selectedNote as any}
          isOpen={isModalOpen}
          onClose={handleCloseDetail}
          onToggleLike={(noteId) => {
            console.log("Like toggled for note:", noteId);
            // yoki haqiqiy logika:
            // handleToggleLike(noteId)
          }}
        />
      )}
    </DashboardLayout>
  );
}
