import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import {
  getMyProfile,
  getProfileByUsername,
  updateProfile,
  deleteProfile
} from '@/services/profile-service'; // API service'laringizni to'g'ri yo'ldan import qiling
import type { Profile, UserWithProfile, } from '@/services/profile-service'; // Tiplaringizni import qiling
import { logout } from "@/services/auth-service"
// O'z profilingizni olish uchun hook
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

// 🚀 Profilni tahrirlash uchun optimistik hook
export const useUpdateProfile = (): UseMutationResult<Profile, Error, Partial<Profile>> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onMutate: async (newProfileData) => {
      // Aktiv so'rovlarni bekor qilamiz
      await queryClient.cancelQueries({ queryKey: ['myProfile'] });

      // Eskirgan ma'lumotni saqlab qo'yamiz (xatolik bo'lsa, qaytarish uchun)
      const previousProfile = queryClient.getQueryData<UserWithProfile>(['myProfile']);

      // 💡 Keshni yangi ma'lumotlar bilan darhol yangilaymiz
      if (previousProfile) {
        queryClient.setQueryData<UserWithProfile>(['myProfile'], {
          ...previousProfile,
          profile: {
            ...previousProfile.profile,
            ...newProfileData,
          },
        });
      }

      // Saqlangan eski ma'lumotni context orqali onError'ga uzatamiz
      return { previousProfile };
    },
    onError: (err, variables, context) => {
      // Xatolik yuz bersa, avvalgi holatga qaytaramiz
      if (context?.previousProfile) {
        queryClient.setQueryData(['myProfile'], context.previousProfile);
      }
    },
    onSettled: () => {
      // Muvaffaqiyatli yoki xatolik bo'lishidan qat'iy nazar, ma'lumotlarni server bilan sinxronlaymiz
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
  });
};

// ✅ Profilni o'chirish uchun hook
// Bu yerda optimistik yondashuv shart emas, chunki foydalanuvchi baribir tizimdan chiqib ketadi.
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