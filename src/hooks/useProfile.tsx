import { useProfileContext } from "@/contexts/ProfileContext";

export const useProfile = () => {
  // Kept for backwards-compatibility across the app.
  return useProfileContext();
};
