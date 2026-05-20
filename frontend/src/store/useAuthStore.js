import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, userApi } from '../services/api.js';
import { supabase } from '../services/supabase.js';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      jwt: null,
      supabaseSession: null,
      loading: false,
      error: null,
      remember: true,
      setSupabaseSession: (session) => set({ supabaseSession: session }),
      hydrate: async () => {
        const { jwt } = get();
        if (!jwt) return;
        try {
          const { data } = await userApi.me();
          set({ user: data.user, profile: data.profile });
        } catch {
          set({ user: null, profile: null, jwt: null });
        }
      },
      signUpEmail: async ({ email, password, username }) => {
        set({ loading: true, error: null });
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } }
        });
        if (error) {
          set({ loading: false, error: error.message });
          throw error;
        }
        set({ loading: false, supabaseSession: data.session });
        return data;
      },
      signInEmail: async ({ email, password, remember }) => {
        set({ loading: true, error: null, remember });
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          set({ loading: false, error: error.message });
          throw error;
        }
        const session = await authApi.createSession(data.session.access_token);
        set({
          loading: false,
          supabaseSession: data.session,
          jwt: session.data.token,
          user: session.data.user,
          profile: session.data.profile
        });
      },
      sendPhoneOtp: async (phone) => {
        const { error } = await supabase.auth.signInWithOtp({ phone });
        if (error) throw error;
      },
      verifyPhoneOtp: async ({ phone, token }) => {
        const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
        if (error) throw error;
        const session = await authApi.createSession(data.session.access_token);
        set({
          supabaseSession: data.session,
          jwt: session.data.token,
          user: session.data.user,
          profile: session.data.profile
        });
      },
      requestPasswordReset: (email) =>
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`
        }),
      resetPassword: (password) => supabase.auth.updateUser({ password }),
      updateProfile: async (payload) => {
        const { data } = await userApi.update(payload);
        set({ profile: data.profile });
      },
      logout: async () => {
        await authApi.logout().catch(() => {});
        await supabase.auth.signOut().catch(() => {});
        set({ user: null, profile: null, jwt: null, supabaseSession: null });
      }
    }),
    {
      name: 'telechat-auth',
      partialize: (state) => ({
        jwt: state.remember ? state.jwt : null,
        user: state.remember ? state.user : null,
        profile: state.remember ? state.profile : null,
        remember: state.remember
      })
    }
  )
);
