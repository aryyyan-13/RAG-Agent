import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      setAuth: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
          error: null,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        localStorage.removeItem('auth-store');
      },

      setError: (error) => {
        set({ error });
      },

      initAuth: () => {
        try {
          const stored = localStorage.getItem('auth-store');
          if (stored) {
            const { state } = JSON.parse(stored);
            if (state.token && state.user) {
              set({
                user: state.user,
                token: state.token,
                isAuthenticated: true,
                isLoading: false,
              });
              return;
            }
          }
        } catch (err) {
          console.error('Auth init error:', err);
        }
        set({ isLoading: false });
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
