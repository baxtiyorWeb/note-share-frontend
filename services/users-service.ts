import api from "@/config/api"

export const getAllUsers = async () => {
  const response = await api.get("/users")
  return response.data
}