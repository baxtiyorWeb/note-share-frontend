import api from "@/config/api";

export interface Profile {
  id: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string
  coverImage?: string;
}

export interface UserWithProfile {
  id: number;
  email: string;
  profile: Profile;

}

export const getMyProfile = async (): Promise<UserWithProfile> => {
  const response = await api.get('/profile/me');
  return response.data;
};

export const getProfileByUsername = async (username: string): Promise<Profile> => {
  const response = await api.get(`/profile/${username}`);
  return response.data;
};

export const updateProfile = async (data: Partial<Profile>): Promise<Profile> => {
  const response = await api.put('/profile/update', data);
  return response.data.data;
};

export const deleteProfile = async (): Promise<{ message: string }> => {
  const response = await api.delete('/profile/delete');
  return response.data;
};