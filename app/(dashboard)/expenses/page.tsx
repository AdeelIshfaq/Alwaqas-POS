'use client';

import { useState } from 'react';
import { useExpenses } from '@/hooks/use-data';
import { useAuth } from '@/components/auth-provider';
import { StatCard, Card } from '@/components/ui/card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDate, uid, today } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';

const EXPENSE_CATS = ['Rent', 'Utilities', 'Salaries', 'Transport', 'Maintenance', 'Miscellaneous', 'Shop Supplies'];

export default function ExpensesPage() {
  const { expenses, add, remove } = useExpenses();
  const { canDelete } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ date: today(), description: '', category: '', amount: '' });

  const todayStr = today();
  const todayExp = expenses.filter((e) => e.date === todayStr).reduce((a, e) => a + e.amount, 0);
  const monthExp = expenses
    .filter((e) => e.date?.slice(0, 7) === todayStr.slice(0, 7))
    .reduce((a, e) => a + e.amount, 0);

  const save = async () => {
    if (!form.amount || !form.description) return;
    await add({
      id: uid(),
      date: form.date || today(),
      description: form.description,
      category: form.category || 'Other',
      amount: +form.amount,
    });
    setModalOpen(false);
    setForm({ date: today(), description: '', category: '', amount: '' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
        </div>
        <button
          onClick={() => { setForm({ date: today(), description: '', category: '', amount: '' }); setModalOpen(true); }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Today" value={formatCurrency(todayExp)} color="red" />
        <StatCard label="This Month" value={formatCurrency(monthExp)} color="red" />
        <StatCard label="Total Records" value={expenses.length.toString()} />
      </div>

      <Table>
        <Thead>
          <Th>Date</Th>
          <Th>Description</Th>
          <Th>Category</Th>
          <Th>Amount</Th>
          <Th></Th>
        </Thead>
        <Tbody>
          {[...expenses].reverse().map((e) => (
            <Tr key={e.id}>
              <Td>{formatDate(e.date)}</Td>
              <Td>{e.description}</Td>
              <Td>
                <Badge variant="purple">{e.category || 'Other'}</Badge>
              </Td>
              <Td className="font-mono text-red-400">{formatCurrency(e.amount)}</Td>
              <Td>
                {canDelete && (
                  <button onClick={() => remove(e.id)} className="p-1.5 rounded hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                )}
              </Td>
            </Tr>
          ))}
          {expenses.length === 0 && (
            <Tr>
              <Td colSpan={5} className="text-center text-muted-foreground py-8">
                No expenses recorded
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Expense" className="max-w-md">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Select</option>
              {EXPENSE_CATS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Amount (Rs)</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
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
    </div>
  );
}
