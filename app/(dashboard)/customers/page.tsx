'use client';

import { useState } from 'react';
import { useCustomers, useLedger } from '@/hooks/use-data';
import { useAuth } from '@/components/auth-provider';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, uid, today } from '@/lib/utils';
import { Plus, Pencil, Trash2, Banknote } from 'lucide-react';

export default function CustomersPage() {
  const { customers, add, update, remove } = useCustomers();
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

  const openEdit = (c: any) => {
    setForm({ name: c.name, phone: c.phone, address: c.address });
    setEditing(c);
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name) return;
    if (editing) await update(editing.id, form);
    else await add({ ...form, id: uid() });
    setModalOpen(false);
  };

  const getBalance = (custId: string) => {
    const custEntries = entries.filter((e) => e.type === 'customer' && e.party_id === custId);
    return custEntries.reduce((a, e) => a + (e.debit || 0) - (e.credit || 0), 0);
  };

  const receivePayment = async () => {
    if (!payAmt || +payAmt <= 0 || !payModal) return;
    await addLedger({
      date: today(),
      type: 'customer',
      party_id: payModal.id,
      description: 'Payment Received',
      debit: 0,
      credit: +payAmt,
      ref: 'payment',
    });
    setPayModal(null);
    setPayAmt('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{customers.length} registered</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      <Table>
        <Thead>
          <Th>Name</Th>
          <Th>Phone</Th>
          <Th>Address</Th>
          <Th>Balance</Th>
          <Th>Actions</Th>
        </Thead>
        <Tbody>
          {customers.map((c) => {
            const bal = getBalance(c.id);
            return (
              <Tr key={c.id}>
                <Td className="font-medium">{c.name}</Td>
                <Td>{c.phone}</Td>
                <Td className="text-muted-foreground text-xs">{c.address}</Td>
                <Td>
                  <span className={`font-mono font-bold ${bal > 0 ? 'text-red-400' : bal < 0 ? 'text-green-400' : 'text-muted-foreground'}`}>
                    {formatCurrency(Math.abs(bal))} {bal > 0 ? '(Due)' : bal < 0 ? '(Advance)' : ''}
                  </span>
                </Td>
                <Td>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-secondary transition-colors">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    {bal > 0 && (
                      <button onClick={() => { setPayModal(c); setPayAmt(''); }} className="p-1.5 rounded hover:bg-green-500/10 transition-colors">
                        <Banknote className="w-3.5 h-3.5 text-green-400" />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => remove(c.id)} className="p-1.5 rounded hover:bg-red-500/10 transition-colors">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
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

      <Modal open={!!payModal} onClose={() => setPayModal(null)} title={`Receive Payment — ${payModal?.name}`} className="max-w-sm">
        {payModal && (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              Outstanding: <span className="font-mono text-red-400 font-bold">{formatCurrency(getBalance(payModal.id))}</span>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Amount Received</label>
              <input
                type="number"
                value={payAmt}
                onChange={(e) => setPayAmt(e.target.value)}
                placeholder="Enter amount"
                className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </>
        )}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <button onClick={() => setPayModal(null)} className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors">
            Cancel
          </button>
          <button onClick={receivePayment} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Record Payment
          </button>
        </div>
      </Modal>
    </div>
  );
}
