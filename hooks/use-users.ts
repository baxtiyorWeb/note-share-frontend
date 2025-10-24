import { getAllUsers } from "@/services/users-service";
import { User } from "@/types";
import { useQuery, UseQueryResult } from "@tanstack/react-query";

export const useUsers = (): UseQueryResult<User[], Error> => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => getAllUsers(),
  });
};