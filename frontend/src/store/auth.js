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

  // 🔄 Refresh user data from API
  refreshUserData: async () => {
    const userId = get().allUserData?.user_id;
    if (!userId) return;

    try {
      set({ loading: true });
      const response = await fetch(`http://127.0.0.1:8000/api/v1/user/profile/${userId}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const profileData = await response.json();
        
        // Primary check: teacher_id from Teacher profile
        let teacherId = profileData.teacher_id || 0;
        
        // Fallback check: if application is approved but teacher_id not yet set, use a placeholder
        if (profileData.application_status?.is_approved && !teacherId) {
          teacherId = 1; // Mark as approved (Teacher profile may be created but not yet reflected)
          console.log("Application approved but Teacher profile being created...");
        }
        
        // Update user data with teacher_id from the profile response
        const updatedUserData = {
          ...get().allUserData,
          teacher_id: teacherId,
        };
        console.log("User data refreshed. New teacher_id:", teacherId);
        set({ allUserData: updatedUserData });
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    } finally {
      set({ loading: false });
    }
  },

  isLoggedIn: () => get().allUserData !== null,
}));

if (import.meta.env.DEV) {
  mountStoreDevtool("Store", useAuthStore);
}

export { useAuthStore };
