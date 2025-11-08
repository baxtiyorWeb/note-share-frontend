"use client";

import React, { useState, useMemo } from "react";
import { motion, Variants } from "framer-motion";
import {
  Loader2,
  MessageCircle,
  UserCheck,
  UserPlus,
  Lightbulb,
  Users,
  Bookmark,
  Eye,
  Heart,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MinimalNoteCard } from "@/components/dashboard/note-card";
import { NoteDetailModal } from "@/components/dashboard/note-detail-modal";
import { FollowListModal } from "../follow-list-modal";

import { useProfileByUsername, useMyProfile } from "@/hooks/use-profile";
import { useToggleFollow, useFollowCounts } from "@/hooks/use-follow";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { Note } from "@/types";
import { useDeleteNote, useNote, useNotes } from "@/hooks/use-note";
import { deleteNote } from "@/services/notes-service";

// === Animation variants ===
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

// === Helper ===
const getInitials = (f?: string, l?: string) => `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase();

export default function UserProfilePage() {
  const { data: myProfile } = useMyProfile();
  const currentUserId = myProfile?.id;
  const username = myProfile?.profile?.username as string;

  const { data: profile, isLoading, error } = useProfileByUsername(username);
  const { data: notes, refetch, isLoading: noteLoad, } = useNotes();
  const targetUserId = myProfile?.id as number;

  const { data: followCounts } = useFollowCounts(targetUserId);
  const deleteNote = useDeleteNote();
  const { mutate: toggleFollow, isPending } = useToggleFollow();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  const isOwnProfile = currentUserId === targetUserId;
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [followListOpen, setFollowListOpen] = useState(false);
  const [followListType, setFollowListType] = useState<"followers" | "following" | null>(null);

  const isFollowing = myProfile?.profile?.isFollowing ?? false;
  console.log(isFollowing, myProfile);
  const handleFollow = () => {
    toggleFollow(username, {
      onSuccess: () => toast.success(isFollowing ? "Unfollowed" : "Followed!"),
      onError: () => toast.error("Failed to update follow status"),
    });
  };

  const openNote = (note: Note) => {
    setSelectedNote(note);
    setModalOpen(true);
  };

  const openFollowList = (type: "followers" | "following") => {
    setFollowListType(type);
    setFollowListOpen(true);
  };
  const onDelete = (noteId: number) => {
    deleteNote.mutate(noteId)
    refetch()
  }
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto mt-32 text-center">
        <Lightbulb className="h-16 w-16 text-yellow-500 mx-auto mb-4 opacity-70" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Profile Not Found</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2">@{username} not found</p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/dashboard/explore">Explore Notes</Link>
        </Button>
      </div>
    );
  }

  const totalNotes = stats?.totalNotes ?? notes?.length;
  const totalViews = stats?.totalViews ?? 0;
  const totalLikes = stats?.totalLikes ?? 0;
  const followersCount = myProfile?.followers?.length ?? 0;

  const followingCount = myProfile?.following?.length ?? 0;
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <motion.div
        className="max-w-full mx-auto px-4 py-10 space-y-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* === HEADER === */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800"
        >
          {/* Cover */}
          <div className="h-60 md:h-80 relative">
            {profile.coverImage ? (
              <img
                src={profile.coverImage}
                alt="cover"
                className="w-full h-full object-cover opacity-90"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center">
                <Lightbulb className="h-20 w-20 text-white/30 animate-pulse" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </div>

          {/* Profile Info */}
          <div className="relative px-6 pb-10 -mt-20 md:-mt-28">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              {/* Avatar */}
              <motion.div whileHover={{ scale: 1.05 }}>
                <Avatar className="h-32 w-32 md:h-40 md:w-40 ring-8 ring-white dark:ring-slate-900 shadow-2xl border-4 border-white/10">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-4xl font-bold">
                    {getInitials(profile.firstName, profile.lastName)}
                  </AvatarFallback>
                </Avatar>
              </motion.div>

              {/* Name + Username */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white">
                  {profile.firstName} {profile.lastName}
                </h1>
                <p className="text-lg text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                  @{profile.username}
                </p>
              </div>

              {/* Actions */}
              {!isOwnProfile && (
                <div className="flex gap-3">
                  <Button variant="outline" size="lg" className="shadow-sm hover:bg-slate-100">
                    <MessageCircle className="h-5 w-5 mr-2" /> Message
                  </Button>
                  <Button
                    onClick={handleFollow}
                    disabled={isPending}
                    size="lg"
                    className={`shadow-md ${isFollowing
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                      }`}
                  >
                    {isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : isFollowing ? (
                      <>
                        <UserCheck className="h-5 w-5 mr-2" /> Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-5 w-5 mr-2" /> Follow
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Bio */}
            <motion.div
              variants={itemVariants}
              className="mt-8 px-5 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl border-l-4 border-indigo-500"
            >
              <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed italic">
                {profile.bio || "This user hasn’t added a bio yet."}
              </p>
            </motion.div>

            {/* === MINIMAL STATS (below bio) === */}
            <div className="flex items-center gap-6 mt-5 text-sm font-medium text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-purple-400" />
                <span className="text-white dark:text-white/90">{totalNotes}</span>
                <span>Notes</span>
              </div>
              <button
                onClick={() => openFollowList("followers")}
                className="flex items-center gap-2 hover:text-purple-300 transition-colors"
              >
                <Users className="w-4 h-4 text-purple-400" />
                <span className="text-white dark:text-white/90">{followersCount}</span>
                <span>Followers</span>
              </button>
              <button
                onClick={() => openFollowList("following")}
                className="flex items-center gap-2 hover:text-purple-300 transition-colors"
              >
                <UserPlus className="w-4 h-4 text-purple-400" />
                <span className="text-white dark:text-white/90">{followingCount}</span>
                <span>Following</span>
              </button>
            </div>
          </div>
        </motion.div>

        <Separator className="max-w-4xl mx-auto" />

        <motion.div variants={itemVariants}>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
            <Lightbulb className="h-8 w-8 text-yellow-500" />
            {isOwnProfile ? "Your Knowledge Notes" : `@${profile.username}'s Knowledge Log`}
          </h2>

          {notes?.length === 0 ? (
            <EmptyState username={profile.username} isOwn={isOwnProfile} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {notes?.map((note) => (
                <motion.div
                  key={note.id}
                  variants={itemVariants}
                  whileHover={{ y: -4 }}
                  className="group"
                >
                  <MinimalNoteCard
                    note={note as any}
                    currentProfileId={currentUserId}
                    onToggleLike={() => { }}
                    onOpenDetail={openNote}
                    onDelete={onDelete}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>

      <NoteDetailModal
        note={selectedNote}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        currentProfileId={currentUserId}
        onToggleLike={() => { }}
      />

      <FollowListModal
        type={followListType}
        isOpen={followListOpen}
        onOpenChange={setFollowListOpen}
        users={
          followListType === "followers"
            ? myProfile?.followers ?? []
            : myProfile?.following ?? []
        }
        userId={targetUserId}
      />
    </div>
  );
}

function EmptyState({ username, isOwn }: { username: string | undefined; isOwn: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700"
    >
      <Lightbulb className="h-16 w-16 text-yellow-500 mx-auto mb-4 opacity-70" />
      <p className="text-xl font-medium text-slate-700 dark:text-slate-300">
        {isOwn ? "You have not posted a note yet." : `@${username} has not posted a note yet.`}
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
        {isOwn ? "Share your first idea!" : "We are waiting for their first idea..."}
      </p>
      {isOwn && (
        <Button asChild className="mt-6 bg-gradient-to-r from-indigo-600 to-purple-600">
          <Link href="/dashboard/new">+ New Note</Link>
        </Button>
      )}
    </motion.div>
  );
}
