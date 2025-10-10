import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { login, register } from '@/services/auth-service';
import { LoginData, RegisterData, AuthResponse } from '@/services/auth-service';

export const useRegister = (): UseMutationResult<AuthResponse, Error, RegisterData> => {
  return useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
    },
  });
};

export const useLogin = (): UseMutationResult<AuthResponse, Error, LoginData> => {
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
    },
  });
};