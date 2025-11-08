import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  toggleFollow,
  getFollowers,
  getFollowing,
  getFollowCounts,
  type FollowResponse,
  type FollowUser,
  type FollowersCount,
} from "@/services/follow-service";


// === 1. Toggle Follow / Unfollow ===
export const useToggleFollow = () => {
  const queryClient = useQueryClient();

  return useMutation<FollowResponse, Error, string>({
    mutationFn: toggleFollow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["followCounts"] });
    },
  });
};


// === 2. Get Followers list ===
export const useFollowers = (userId: number) => {
  return useQuery<FollowUser[], Error>({
    queryKey: ["followers", userId],
    queryFn: () => getFollowers(userId),
    enabled: !!userId,
  });
};

// === 3. Get Following list ===
export const useFollowing = (userId: number) => {
  return useQuery<FollowUser[], Error>({
    queryKey: ["following", userId],
    queryFn: () => getFollowing(userId),
    enabled: !!userId,
  });
};

// === 4. Get Followers/Following Count ===
export const useFollowCounts = (userId: number) => {
  return useQuery<FollowersCount, Error>({
    queryKey: ["followCounts", userId],
    queryFn: () => getFollowCounts(userId),
    enabled: !!userId,
  });
};
