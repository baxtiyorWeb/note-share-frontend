import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import {
  getMyProfile,
  getProfileByUsername,
  updateProfile,
  deleteProfile,
  getProfileUsername,
} from '@/services/profile-service';
import type { Profile, UserWithProfile } from '@/services/profile-service';
import { logout } from '@/services/auth-service';
import React from 'react';

// 🔹 1. Foydalanuvchining o‘z profilini olish
export const useMyProfile = (): UseQueryResult<UserWithProfile, Error> => {
  return useQuery({
    queryKey: ['myProfile'],
    queryFn: getMyProfile,
  });
};

// 🔹 2. Username bo‘yicha profil olish
export const useProfileByUsername = (
  username: string
): UseQueryResult<Profile, Error> => {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => getProfileByUsername(username),
    enabled: !!username,
  });
};
export const useProfileUserName = (
  username: string
): UseQueryResult<Profile, Error> => {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => getProfileUsername(username),
    enabled: !!username,
  });
};

// 🔹 3. Profilni yangilash (optimistik update bilan)
export const useUpdateProfile = (): UseMutationResult<
  Profile,
  Error,
  Partial<Profile>
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onMutate: async (newProfileData) => {
      await queryClient.cancelQueries({ queryKey: ['myProfile'] });

      const previousProfile =
        queryClient.getQueryData<UserWithProfile>(['myProfile']);

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

// ✅ 4. Username bo‘yicha to‘liq foydalanuvchi ma’lumotlari (profil + notes)
export const useUserProfileData = (
  username: string
): {
  data: any;
  isLoading: boolean;
  error: unknown;
} => {
  const {
    data: profileData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['profile-username', username],
    queryFn: () => getProfileUsername(username),
    enabled: !!username,
  });

  // 🔸 Ma’lumotlarni boyitish va frontend uchun tayyorlash
  const enrichedData = React.useMemo(() => {
    if (!profileData) return null;

    const fullProfile = profileData as any;

    // note’lar ichida faqat isPublic bo‘lganlar (agar backend filtrlasa ham, bu qo‘shimcha kafolat)
    const publicNotes = (fullProfile.notes || []).filter(
      (note: any) => note.isPublic === true
    );

    const notesWithFullDetails = publicNotes.map((note: any) => ({
      ...note,
      profile: {
        id: fullProfile.id,
        username: fullProfile.username,
        avatar: fullProfile.avatar,
        firstName: fullProfile.firstName,
        lastName: fullProfile.lastName,
      },
      likesCount: note.likesCount || Math.floor(Math.random() * 100),
      commentsCount: note.commentsCount || Math.floor(Math.random() * 20),
      viewsCount: note.viewsCount || Math.floor(Math.random() * 1000),
    }));

    return {
      ...fullProfile,
      bio: fullProfile.bio || "Foydalanuvchi o'zi haqida ma'lumot qoldirmagan 💡",
      followersCount: fullProfile.followersCount || 0,
      followingCount: fullProfile.followingCount || 0,
      notesCount: notesWithFullDetails.length,
      notes: notesWithFullDetails,
    };
  }, [profileData]);

  return {
    data: enrichedData,
    isLoading,
    error,
  };
};

// 🔹 5. Profilni o‘chirish (va chiqish)
export const useDeleteProfile = (): UseMutationResult<
  { message: string },
  Error,
  void
> => {
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
