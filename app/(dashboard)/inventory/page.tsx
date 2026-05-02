'use client';

import { useState } from 'react';
import { useProducts, useCategories } from '@/hooks/use-data';
import { useAuth } from '@/components/auth-provider';
import { Card } from '@/components/ui/card';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { formatCurrency, uid } from '@/lib/utils';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';

export default function InventoryPage() {
  const { products, add, update, remove } = useProducts();
  const { categories, add: addCat, remove: removeCat } = useCategories();
  const { canDelete } = useAuth();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [catInput, setCatInput] = useState('');

  const [form, setForm] = useState({
    name: '',
    category_id: '',
    unit: '',
    cost_price: 0,
    sale_price: 0,
    stock: 0,
    min_stock: 5,
  });

  const openAdd = () => {
    setForm({ name: '', category_id: '', unit: '', cost_price: 0, sale_price: 0, stock: 0, min_stock: 5 });
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (p: any) => {
    setForm({
      name: p.name,
      category_id: p.category_id,
      unit: p.unit,
      cost_price: p.cost_price,
      sale_price: p.sale_price,
      stock: p.stock,
      min_stock: p.min_stock,
    });
    setEditing(p);
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name || !form.sale_price) return;
    if (editing) {
      await update(editing.id, form);
    } else {
      await add({ ...form, id: uid() });
    }
    setModalOpen(false);
  };

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{products.length} products</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg bg-secondary border border-border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex gap-2 items-center">
          <input
            placeholder="New category..."
            value={catInput}
            onChange={(e) => setCatInput(e.target.value)}
            className="w-40 rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={() => { if (catInput) { addCat(catInput); setCatInput(''); } }}
            className="rounded-lg bg-secondary border border-border px-3 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            Add Cat
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((c) => (
          <span key={c.id} className="inline-flex items-center gap-1 rounded-full bg-secondary border border-border px-2.5 py-1 text-xs">
            {c.name}
            {canDelete && (
              <button onClick={() => removeCat(c.id)} className="text-muted-foreground hover:text-red-400">
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
      </div>

      <Table>
        <Thead>
          <Th>#</Th>
          <Th>Product Name</Th>
          <Th>Category</Th>
          <Th>Unit</Th>
          <Th>Cost Price</Th>
          <Th>Sale Price</Th>
          <Th>Margin</Th>
          <Th>Stock</Th>
          <Th>Status</Th>
          <Th>Actions</Th>
        </Thead>
        <Tbody>
          {filtered.map((p, i) => {
            const margin = p.sale_price > 0 ? (((p.sale_price - p.cost_price) / p.sale_price) * 100).toFixed(1) : '0';
            const cat = categories.find((c) => c.id === p.category_id);
            return (
              <Tr key={p.id}>
                <Td className="text-muted-foreground font-mono text-[11px]">{i + 1}</Td>
                <Td className="font-medium">{p.name}</Td>
                <Td>
                  <Badge variant="blue">{cat?.name || '-'}</Badge>
                </Td>
                <Td>{p.unit}</Td>
                <Td className="font-mono">{formatCurrency(p.cost_price)}</Td>
                <Td className="font-mono text-orange-400">{formatCurrency(p.sale_price)}</Td>
                <Td>
                  <Badge variant="green">{margin}%</Badge>
                </Td>
                <Td className="font-mono">{p.stock}</Td>
                <Td>
                  <Badge
                    variant={
                      p.stock <= p.min_stock ? 'red' : p.stock <= p.min_stock * 2 ? 'yellow' : 'green'
                    }
                  >
                    {p.stock <= p.min_stock ? 'Low' : 'OK'}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-secondary transition-colors">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    {canDelete && (
                      <button onClick={() => remove(p.id)} className="p-1.5 rounded hover:bg-red-500/10 transition-colors">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Product' : 'Add Product'}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Product Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. Wall Paint White 20L"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Category</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Select</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Unit</label>
            <input
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Pcs / Kg / Ft..."
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Cost Price (Rs)</label>
            <input
              type="number"
              value={form.cost_price}
              onChange={(e) => setForm({ ...form, cost_price: +e.target.value })}
              className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Sale Price (Rs)</label>
            <input
              type="number"
              value={form.sale_price}
              onChange={(e) => setForm({ ...form, sale_price: +e.target.value })}
              className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Current Stock</label>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: +e.target.value })}
              className="mt-1 w-full rounded-lg bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Min Stock (Alert)</label>
            <input
              type="number"
              value={form.min_stock}
              onChange={(e) => setForm({ ...form, min_stock: +e.target.value })}
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
