// src/components/dashboard/follow-list-modal.tsx

"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Loader2, Users, ArrowRight } from "lucide-react";
import { useFollowers, useFollowing, useToggleFollow } from "@/hooks/use-follow";
import { useMyProfile } from "@/hooks/use-profile";
import toast from "react-hot-toast";
import { FollowUser } from "@/services/follow-service";

// --- Utility Functions (Assuming they are imported or available) ---
const getInitials = (user: FollowUser) =>
  `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || user.username?.[0].toUpperCase() || 'U';


// --- Follow List Item Component ---
interface FollowListItemProps {
  user: FollowUser;
  currentProfileId: number | undefined;
}

const FollowListItem: React.FC<FollowListItemProps> = ({ user, currentProfileId }) => {
  const { data: myProfile } = useMyProfile();
  const myUsername = myProfile?.profile?.username;


  // The isFollowing status should be fetched as part of the profile data or user list if necessary,
  // but for simplicity and to match the existing useToggleFollow hook structure:
  // We assume the list returned by useFollowers/useFollowing is correct at the time of fetch.

  // Note: We can only toggle follow on users who aren't ourselves.
  const isMe = myProfile?.id === user.id;

  // Since we are inside the FollowListModal, we rely on TanStack Query automatic re-fetch
  // after the mutation to update the lists, but we won't show a toggle button here
  // as the lists only show who IS following or IS FOLLOWED. A full profile page is better for toggling.
  // We will prioritize navigation.

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between p-3 transition-colors duration-200 rounded-lg hover:bg-slate-800/50"
    >
      <Link href={`/dashboard/profile/${user.username}`} className="flex items-center gap-3 flex-grow group" scroll={false}>
        <Avatar className="h-10 w-10 border-2 border-indigo-500/50">
          <AvatarImage src={user.avatar || undefined} />
          <AvatarFallback className="bg-indigo-600 text-white font-bold text-sm">
            {getInitials(user)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col overflow-hidden">
          <p className="text-sm font-semibold text-gray-100 group-hover:text-indigo-400 truncate">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-indigo-400 dark:text-indigo-300 truncate">
            @{user.username} {isMe && "(You)"}
          </p>
        </div>
      </Link>

      <Button asChild variant="outline" size="sm" className="h-8 text-xs dark:bg-slate-700 dark:hover:bg-slate-600 border-indigo-500/30">
        <Link href={`/dashboard/profile/${user.username}`} scroll={false}>
          View Profile
          <ArrowRight className="w-3 h-3 ml-2" />
        </Link>
      </Button>
    </motion.div>
  );
};


// --- Main Modal Component ---
export interface FollowListModalProps {
  userId: number | null;
  type: 'followers' | 'following' | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  users?: any[];
}

export const FollowListModal: React.FC<FollowListModalProps> = ({ userId, type, isOpen, onOpenChange }) => {
  const { data: myProfile } = useMyProfile();
  const currentProfileId = myProfile?.id;

  const isFollowers = type === 'followers';
  const title = isFollowers ? "Followers" : "Following";

  // Use the appropriate hook based on 'type'
  const { data: followers, isLoading: isFollowersLoading } = useFollowers(isFollowers && userId ? userId : 0);
  const { data: following, isLoading: isFollowingLoading } = useFollowing(!isFollowers && userId ? userId : 0);

  const listData = isFollowers ? followers : following;
  const isLoading = isFollowers ? isFollowersLoading : isFollowingLoading;

  // Close the modal and reset state on URL change
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl bg-slate-900 border-slate-700 text-gray-50 rounded-xl shadow-2xl p-6">
        <DialogHeader className="border-b border-indigo-600/30 pb-3">
          <DialogTitle className="text-3xl font-extrabold text-indigo-400 flex items-center gap-3">
            <Users className="w-6 h-6" /> {title} ({listData?.length ?? 0})
          </DialogTitle>
        </DialogHeader>

        <motion.div
          className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {isLoading && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          )}

          {!isLoading && listData && listData.length > 0 ? (
            listData.map((user) => (
              <FollowListItem key={user.id} user={user} currentProfileId={currentProfileId} />
            ))
          ) : !isLoading && (
            <div className="text-center py-10 text-slate-500 italic">
              <p>No {title.toLowerCase()} found.</p>
              <p className="mt-2 text-sm text-indigo-500">
                {isFollowers ? "Start creating inspiring content to attract followers!" : "Explore new profiles and follow your favorites!"}
              </p>
            </div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};