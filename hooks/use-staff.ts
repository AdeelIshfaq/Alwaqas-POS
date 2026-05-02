'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Staff } from '@/types';

export function useStaff() {
  const supabase = createClient();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('staff').select('*').order('created_at', { ascending: false });
    setStaff(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel('staff_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff' }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch, supabase]);

  const updateRole = async (id: string, role: string) => {
    await supabase.from('staff').update({ role }).eq('id', id);
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    await supabase.from('staff').update({ is_active }).eq('id', id);
  };

  const remove = async (id: string) => {
    await supabase.auth.admin.deleteUser(id);
    await supabase.from('staff').delete().eq('id', id);
  };

  return { staff, loading, updateRole, toggleActive, remove, refresh: fetch };
}
