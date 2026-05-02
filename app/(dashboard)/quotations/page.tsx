'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuotations, useProducts, useCustomers } from '@/hooks/use-data';
import { useAuth } from '@/components/auth-provider';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, formatDate, uid, today, generateQuoteNo } from '@/lib/utils';
import { Plus, Pencil, Eye, Check, X, ArrowRight, Trash2 } from 'lucide-react';

interface QuoteItem {
  id: string;
  product_id: string;
  name: string;
  qty: number;
  price: number;
  cost: number;
  unit: string;
}

export default function QuotationsPage() {
  const { quotations, add, update, remove } = useQuotations();
  const { products } = useProducts();
  const { customers } = useCustomers();
  const { canDelete } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    date: today(),
    customer_id: '',
    discount: 0,
    notes: '',
    status: 'pending' as const,
  });
  const [items, setItems] = useState<QuoteItem[]>([]);

  const openNew = () => {
    setForm({ date: today(), customer_id: '', discount: 0, notes: '', status: 'pending' });
    setItems([]);
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (q: any) => {
    setForm({
      date: q.date,
      customer_id: q.customer_id || '',
      discount: q.discount || 0,
      notes: q.notes || '',
      status: q.status,
    });
    setItems(q.items || []);
    setEditing(q);
    setModalOpen(true);
  };

  const addItem = () => {
    setItems((prev) => [...prev, { id: uid(), product_id: '', name: '', qty: 1, price: 0, cost: 0, unit: '' }]);
  };

  const updateItem = (idx: number, field: string, val: any) => {
    setItems((prev) => {
      const updated = [...prev];
      if (field === 'product_id') {
        const p = products.find((x) => x.id === val);
        updated[idx] = { ...updated[idx], product_id: val, name: p?.name || '', price: p?.sale_price || 0, cost: p?.cost_price || 0, unit: p?.unit || '' };
      } else {
        updated[idx] = { ...updated[idx], [field]: field === 'qty' || field === 'price' ? +val : val };
      }
      return updated;
    });
  };

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const subtotal = items.reduce((a, x) => a + x.price * x.qty, 0);
  const discAmt = subtotal * ((form.discount || 0) / 100);
  const total = subtotal - discAmt;

  const save = async () => {
    if (items.length === 0) return;
    const cust = customers.find((c) => c.id === form.customer_id);
    const q = {
      ...form,
      id: editing?.id || uid(),
      quote_no: editing?.quote_no || generateQuoteNo(),
      items,
      subtotal,
      discount_amount: discAmt,
      total,
      customer_name: cust?.name || 'Walk-in',
    };
    if (editing) await update(editing.id, q);
    else await add(q);
    setModalOpen(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await update(id, { status });
  };

  const statusColor: Record<string, any> = { pending: 'yellow', approved: 'green', converted: 'blue', rejected: 'red' };

  const filtered = quotations.filter(
    (q) =>
      (q.quote_no || '').includes(search) ||
      (q.customer_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quotations</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{quotations.length} total</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Quotation
        </button>
      </div>

      <input
        placeholder="Search quotations..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full max-w-sm rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
      />

      <Table>
        <Thead>
          <Th>Quote #</Th>
          <Th>Date</Th>
          <Th>Customer</Th>
          <Th>Amount</Th>
          <Th>Status</Th>
          <Th>Actions</Th>
        </Thead>
        <Tbody>
          {filtered.length === 0 ? (
            <Tr>
              <Td colSpan={6} className="text-center text-muted-foreground py-8">
                No quotations
              </Td>
            </Tr>
          ) : (
            [...filtered].reverse().map((q) => (
              <Tr key={q.id}>
                <Td className="font-mono text-[11px]">{q.quote_no}</Td>
                <Td>{formatDate(q.date)}</Td>
                <Td>{q.customer_name || 'Walk-in'}</Td>
                <Td className="font-mono text-orange-400">{formatCurrency(q.total)}</Td>
                <Td>
                  <Badge variant={statusColor[q.status] || 'yellow'}>{q.status}</Badge>
                </Td>
                <Td>
                  <div className="flex gap-1.5 flex-wrap">
                    <button onClick={() => setViewModal(q)} className="p-1.5 rounded hover:bg-secondary transition-colors">
                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    {q.status !== 'converted' && q.status !== 'rejected' && (
                      <>
                        <button onClick={() => openEdit(q)} className="p-1.5 rounded hover:bg-secondary transition-colors">
                          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        {q.status === 'pending' && (
                          <button onClick={() => updateStatus(q.id, 'approved')} className="p-1.5 rounded hover:bg-green-500/10 transition-colors">
                            <Check className="w-3.5 h-3.5 text-green-400" />
                          </button>
                        )}
                        {(q.status === 'approved' || q.status === 'pending') && (
                          <Link href="/pos" onClick={() => { updateStatus(q.id, 'approved'); localStorage.setItem('loadQuote', q.id); }} className="p-1.5 rounded hover:bg-primary/10 transition-colors">
                            <ArrowRight className="w-3.5 h-3.5 text-primary" />
                          </Link>
                        )}
                        <button onClick={() => updateStatus(q.id, 'rejected')} className="p-1.5 rounded hover:bg-red-500/10 transition-colors">
                          <X className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </>
                    )}
                    {canDelete && (
                      <button onClick={() => remove(q.id)} className="p-1.5 rounded hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    )}
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>

      {/* Form Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Quotation' : 'New Quotation'} className="max-w-2xl">
        <div className="grid grid-cols-2 gap-4 mb-4">
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
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Customer</label>
            <select
              value={form.customer_id}
              onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
              className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Walk-in</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Discount %</label>
            <input
              type="number"
              value={form.discount}
              onChange={(e) => setForm({ ...form, discount: +e.target.value })}
              min="0"
              max="100"
              className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Notes</label>
            <input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-sm">Items</span>
          <button onClick={addItem} className="rounded-lg bg-secondary border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary/80 transition-colors">
            + Add Item
          </button>
        </div>

        {items.map((item, idx) => (
          <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 mb-2 items-center">
            <select
              value={item.product_id}
              onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
              className="rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Select Product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Qty"
              value={item.qty}
              onChange={(e) => updateItem(idx, 'qty', e.target.value)}
              min="1"
              className="rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              type="number"
              placeholder="Price"
              value={item.price}
              onChange={(e) => updateItem(idx, 'price', e.target.value)}
              className="rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button onClick={() => removeItem(idx)} className="p-1.5 rounded hover:bg-red-500/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>
        ))}

        <div className="text-right mt-3 text-sm">
          <div className="text-muted-foreground">Subtotal: <span className="font-mono">{formatCurrency(subtotal)}</span></div>
          {discAmt > 0 && <div className="text-red-400">Discount: <span className="font-mono">-{formatCurrency(discAmt)}</span></div>}
          <div className="font-bold text-base mt-1">Total: <span className="font-mono text-orange-400">{formatCurrency(total)}</span></div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <button onClick={() => setModalOpen(false)} className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors">
            Cancel
          </button>
          <button onClick={save} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Save Quotation
          </button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewModal} onClose={() => setViewModal(null)} title={`Quotation — ${viewModal?.quote_no}`} className="max-w-lg">
        {viewModal && (
          <>
            <div className="flex justify-between text-xs text-muted-foreground mb-3">
              <span>Customer: <b className="text-foreground">{viewModal.customer_name || 'Walk-in'}</b></span>
              <span>Date: <b className="text-foreground">{formatDate(viewModal.date)}</b></span>
              <Badge variant={statusColor[viewModal.status] || 'yellow'}>{viewModal.status}</Badge>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-3 py-2 text-left text-[10px] uppercase font-mono text-muted-foreground">Product</th>
                    <th className="px-3 py-2 text-left text-[10px] uppercase font-mono text-muted-foreground">Qty</th>
                    <th className="px-3 py-2 text-left text-[10px] uppercase font-mono text-muted-foreground">Rate</th>
                    <th className="px-3 py-2 text-left text-[10px] uppercase font-mono text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewModal.items || []).map((item: any, i: number) => (
                    <tr key={i} className="border-b border-border last:border-b-0">
                      <td className="px-3 py-2">{item.name}</td>
                      <td className="px-3 py-2">{item.qty} {item.unit}</td>
                      <td className="px-3 py-2 font-mono">{item.price}</td>
                      <td className="px-3 py-2 font-mono text-orange-400">{formatCurrency(item.price * item.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-right mt-3">
              {viewModal.discount_amount > 0 && (
                <div className="text-xs text-red-400">Discount ({viewModal.discount}%): -{formatCurrency(viewModal.discount_amount)}</div>
              )}
              <div className="font-bold text-lg">Total: <span className="font-mono text-orange-400">{formatCurrency(viewModal.total)}</span></div>
            </div>
            {viewModal.notes && <div className="mt-3 text-xs text-muted-foreground">Notes: {viewModal.notes}</div>}
          </>
        )}
        <div className="flex justify-end mt-4">
          <button onClick={() => setViewModal(null)} className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors">
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}
