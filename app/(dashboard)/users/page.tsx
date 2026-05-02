'use client';

import { useState } from 'react';
import { useStaff } from '@/hooks/use-staff';
import { useAuth } from '@/components/auth-provider';
import { Card } from '@/components/ui/card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/utils';
import { Shield, UserCheck, UserX, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const ROLES = [
  { value: 'super_admin', label: 'Super Admin', color: 'orange' as const },
  { value: 'admin', label: 'Admin', color: 'blue' as const },
  { value: 'user', label: 'User', color: 'default' as const },
];

export default function UsersPage() {
  const { staff, loading, updateRole, toggleActive, remove, refresh } = useStaff();
  const { user: currentUser, isSuperAdmin } = useAuth();
  const supabase = createClient();

  const [inviteModal, setInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'user' as const, password: '' });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleInvite = async () => {
    if (!inviteForm.email || !inviteForm.password) return;
    setInviteLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: inviteForm.email,
      password: inviteForm.password,
      options: {
        data: {
          name: inviteForm.name,
          role: inviteForm.role,
        },
      },
    });

    if (error) {
      alert(error.message);
    } else {
      setInviteModal(false);
      setInviteForm({ email: '', name: '', role: 'user', password: '' });
      refresh();
    }
    setInviteLoading(false);
  };

  const handleDelete = async (id: string) => {
    await remove(id);
    setDeleteConfirm(null);
    refresh();
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertTriangle className="w-12 h-12 text-yellow-400 mb-4" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground mt-2">Only Super Admins can access user management.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{staff.length} staff members</p>
        </div>
        <button
          onClick={() => setInviteModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      <Card>
        <Table>
          <Thead>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th>Status</Th>
            <Th>Joined</Th>
            <Th>Actions</Th>
          </Thead>
          <Tbody>
            {staff.map((s) => (
              <Tr key={s.id}>
                <Td className="font-medium">{s.name || '—'}</Td>
                <Td className="text-muted-foreground text-xs">{s.email}</Td>
                <Td>
                  <select
                    value={s.role}
                    onChange={(e) => updateRole(s.id, e.target.value)}
                    disabled={s.id === currentUser?.id}
                    className="rounded bg-secondary border border-border px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </Td>
                <Td>
                  <button
                    onClick={() => toggleActive(s.id, !s.is_active)}
                    disabled={s.id === currentUser?.id}
                    className="disabled:opacity-50"
                  >
                    {s.is_active ? (
                      <Badge variant="green" className="flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> Active
                      </Badge>
                    ) : (
                      <Badge variant="red" className="flex items-center gap-1">
                        <UserX className="w-3 h-3" /> Inactive
                      </Badge>
                    )}
                  </button>
                </Td>
                <Td className="text-muted-foreground text-xs">{formatDate(s.created_at?.slice(0, 10) || '')}</Td>
                <Td>
                  <button
                    onClick={() => setDeleteConfirm(s.id)}
                    disabled={s.id === currentUser?.id}
                    className="p-1.5 rounded hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title={s.id === currentUser?.id ? 'Cannot delete yourself' : 'Delete user'}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>

      {/* Invite Modal */}
      <Modal open={inviteModal} onClose={() => setInviteModal(false)} title="Invite New User" className="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Email</label>
            <input
              type="email"
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="user@company.com"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Full Name</label>
            <input
              value={inviteForm.name}
              onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
              className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Role</label>
            <select
              value={inviteForm.role}
              onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as any })}
              className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Temporary Password</label>
            <input
              type="password"
              value={inviteForm.password}
              onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
              className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Min 6 characters"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <button onClick={() => setInviteModal(false)} className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleInvite}
            disabled={inviteLoading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {inviteLoading ? 'Sending...' : 'Send Invite'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete" className="max-w-sm">
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete this user? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <button onClick={() => setDeleteConfirm(null)} className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
          >
            Delete User
          </button>
        </div>
      </Modal>
    </div>
  );
}
