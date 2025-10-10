import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import {
  getMyProfile,
  getProfileByUsername,
  updateProfile,
  deleteProfile
} from '@/services/profile-service';
import type { Profile, UserWithProfile, } from '@/services/profile-service';
import { logout } from "@/services/auth-service"
export const useMyProfile = (): UseQueryResult<UserWithProfile, Error> => {
  return useQuery({
    queryKey: ['myProfile'],
    queryFn: getMyProfile,
  });
};

export const useProfileByUsername = (username: string): UseQueryResult<Profile, Error> => {

  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => getProfileByUsername(username),
    enabled: !!username,
  });
};

export const useUpdateProfile = (): UseMutationResult<Profile, Error, Partial<Profile>> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onMutate: async (newProfileData) => {
      await queryClient.cancelQueries({ queryKey: ['myProfile'] });

      const previousProfile = queryClient.getQueryData<UserWithProfile>(['myProfile']);

      if (previousProfile) {
        queryClient.setQueryData<UserWithProfile>(['myProfile'], {
          ...previousProfile,
          profile: {
            ...previousProfile.profile,
            ...newProfileData,
          },
        });
      }

      return { previousProfile };
    },
    onError: (err, variables, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(['myProfile'], context.previousProfile);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
  });
};

export const useDeleteProfile = (): UseMutationResult<{ message: string }, Error, void> => {
  const queryClient = useQueryClient();


  return useMutation({
    mutationFn: deleteProfile,
    onSuccess: () => {

      logout();
      queryClient.clear();
      window.location.href = '/login';
    },
  });
};