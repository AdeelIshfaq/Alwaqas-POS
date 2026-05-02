'use client';

import { useState } from 'react';
import { useVendors, useLedger } from '@/hooks/use-data';
import { useAuth } from '@/components/auth-provider';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, uid, today } from '@/lib/utils';
import { Plus, Pencil, Trash2, Banknote } from 'lucide-react';

export default function VendorsPage() {
  const { vendors, add, update, remove } = useVendors();
  const { entries, add: addLedger } = useLedger();
  const { canDelete } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [payModal, setPayModal] = useState<any>(null);
  const [payAmt, setPayAmt] = useState('');
  const [editing, setEditing] = useState<any>(null);

  const [form, setForm] = useState({ name: '', phone: '', address: '' });

  const openAdd = () => {
    setForm({ name: '', phone: '', address: '' });
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (v: any) => {
    setForm({ name: v.name, phone: v.phone, address: v.address });
    setEditing(v);
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name) return;
    if (editing) await update(editing.id, form);
    else await add({ ...form, id: uid() });
    setModalOpen(false);
  };

  const getBalance = (vid: string) => {
    const vendEntries = entries.filter((e) => e.type === 'vendor' && e.party_id === vid);
    return vendEntries.reduce((a, e) => a + (e.credit || 0) - (e.debit || 0), 0);
  };

  const makePayment = async () => {
    if (!payAmt || +payAmt <= 0 || !payModal) return;
    await addLedger({
      date: today(),
      type: 'vendor',
      party_id: payModal.id,
      description: 'Payment Made',
      debit: +payAmt,
      credit: 0,
      ref: 'payment',
    });
    setPayModal(null);
    setPayAmt('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Vendors</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{vendors.length} registered</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Vendor
        </button>
      </div>

      <Table>
        <Thead>
          <Th>Name</Th>
          <Th>Phone</Th>
          <Th>Address</Th>
          <Th>Payable</Th>
          <Th>Actions</Th>
        </Thead>
        <Tbody>
          {vendors.map((v) => {
            const bal = getBalance(v.id);
            return (
              <Tr key={v.id}>
                <Td className="font-medium">{v.name}</Td>
                <Td>{v.phone}</Td>
                <Td className="text-muted-foreground text-xs">{v.address}</Td>
                <Td>
                  <span className={`font-mono font-bold ${bal > 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                    {formatCurrency(bal)} {bal > 0 ? '(Payable)' : ''}
                  </span>
                </Td>
                <Td>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(v)} className="p-1.5 rounded hover:bg-secondary transition-colors">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    {bal > 0 && (
                      <button onClick={() => { setPayModal(v); setPayAmt(''); }} className="p-1.5 rounded hover:bg-green-500/10 transition-colors">
                        <Banknote className="w-3.5 h-3.5 text-green-400" />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => remove(v.id)} className="p-1.5 rounded hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    )}
                  </div>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Vendor' : 'Add Vendor'}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Address</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <button onClick={() => setModalOpen(false)} className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors">
            Cancel
          </button>
          <button onClick={save} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Save
          </button>
        </div>
      </Modal>

      <Modal open={!!payModal} onClose={() => setPayModal(null)} title={`Pay Vendor — ${payModal?.name}`} className="max-w-sm">
        {payModal && (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              Payable: <span className="font-mono text-red-400 font-bold">{formatCurrency(getBalance(payModal.id))}</span>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Payment Amount</label>
              <input
                type="number"
                value={payAmt}
                onChange={(e) => setPayAmt(e.target.value)}
                className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </>
        )}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <button onClick={() => setPayModal(null)} className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors">
            Cancel
          </button>
          <button onClick={makePayment} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Record Payment
          </button>
        </div>
      </Modal>
    </div>
  );
}
