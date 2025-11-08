import api from "@/config/api";

// === Types ===
export interface FollowResponse {
  message: string;
  isFollowing: boolean;
}

export interface FollowersCount {
  followersCount: number;
  followingCount: number;
}

export interface FollowUser {
  id: number;
  username: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
}

// === API functions ===

// 🔹 Toggle follow/unfollow a user
// 🔹 Toggle follow/unfollow a user (by username)
export const toggleFollow = async (username: string): Promise<FollowResponse> => {
  const res = await api.post(`/follow/username/${username}`);
  return res.data;
};



// 🔹 Get followers of a user
export const getFollowers = async (userId: number): Promise<FollowUser[]> => {
  const res = await api.get(`/follow/followers/${userId}`);
  return res.data;
};

// 🔹 Get users that this user follows
export const getFollowing = async (userId: number): Promise<FollowUser[]> => {
  const res = await api.get(`/follow/following/${userId}`);
  return res.data;
};

// 🔹 Get counts (followersCount + followingCount)
export const getFollowCounts = async (userId: number): Promise<FollowersCount> => {
  const res = await api.get(`/follow/count/${userId}`);
  return res.data;
};
