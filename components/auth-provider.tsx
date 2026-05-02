'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Staff, UserRole } from '@/types';

interface AuthContextType {
  user: Staff | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isSuperAdmin: false,
  isAdmin: false,
  canDelete: false,
  canManageUsers: false,
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [user, setUser] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setUser(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('staff')
      .select('*')
      .eq('id', authUser.id)
      .single();
    setUser(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });
    return () => subscription.unsubscribe();
  }, [fetchUser, supabase]);

  const role = user?.role || 'user';
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'admin' || isSuperAdmin;
  const canDelete = isSuperAdmin;
  const canManageUsers = isSuperAdmin;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isSuperAdmin,
      isAdmin,
      canDelete,
      canManageUsers,
      refreshUser: fetchUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
