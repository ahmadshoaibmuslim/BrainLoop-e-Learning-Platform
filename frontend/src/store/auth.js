import { create } from "zustand";
import { mountStoreDevtool } from "simple-zustand-devtools";

const useAuthStore = create((set, get) => ({
  allUserData: null,
  loading: false,

  // 🔁 Return all relevant fields including teacher_id
  user: () => {
    const data = get().allUserData;
    return {
      user_id: data?.user_id || null,
      username: data?.username || null,
      teacher_id: data?.teacher_id || null,  // ✅ Add this line
      
    };
  },

  setUser: (user) => set({ allUserData: user }),
  setLoading: (loading) => set({ loading }),
  isLoggedIn: () => get().allUserData !== null,
}));

if (import.meta.env.DEV) {
  mountStoreDevtool("Store", useAuthStore);
}

export { useAuthStore };
