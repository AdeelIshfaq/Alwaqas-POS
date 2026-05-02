'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Category, Product, Customer, Vendor, Sale, Purchase, Quotation, LedgerEntry, Expense } from '@/types';

export function useProducts() {
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('products').select('*').order('name');
    setProducts(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel('products_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch, supabase]);

  const add = async (product: Omit<Product, 'id' | 'created_at'>) => {
    await supabase.from('products').insert(product);
  };

  const update = async (id: string, product: Partial<Product>) => {
    await supabase.from('products').update(product).eq('id', id);
  };

  const remove = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
  };

  return { products, loading, add, update, remove, refresh: fetch };
}

export function useCategories() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel('categories_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch, supabase]);

  const add = async (name: string) => {
    await supabase.from('categories').insert({ name });
  };

  const remove = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
  };

  return { categories, loading, add, remove, refresh: fetch };
}

export function useCustomers() {
  const supabase = createClient();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('customers').select('*').order('name');
    setCustomers(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel('customers_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch, supabase]);

  const add = async (customer: Omit<Customer, 'id' | 'created_at'>) => {
    await supabase.from('customers').insert(customer);
  };

  const update = async (id: string, customer: Partial<Customer>) => {
    await supabase.from('customers').update(customer).eq('id', id);
  };

  const remove = async (id: string) => {
    await supabase.from('customers').delete().eq('id', id);
  };

  return { customers, loading, add, update, remove, refresh: fetch };
}

export function useVendors() {
  const supabase = createClient();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('vendors').select('*').order('name');
    setVendors(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel('vendors_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch, supabase]);

  const add = async (vendor: Omit<Vendor, 'id' | 'created_at'>) => {
    await supabase.from('vendors').insert(vendor);
  };

  const update = async (id: string, vendor: Partial<Vendor>) => {
    await supabase.from('vendors').update(vendor).eq('id', id);
  };

  const remove = async (id: string) => {
    await supabase.from('vendors').delete().eq('id', id);
  };

  return { vendors, loading, add, update, remove, refresh: fetch };
}

export function useSales() {
  const supabase = createClient();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('sales').select('*').order('date', { ascending: false });
    setSales(data?.map(s => ({ ...s, items: s.items as any })) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel('sales_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch, supabase]);

  const add = async (sale: Omit<Sale, 'id' | 'created_at'>) => {
    await supabase.from('sales').insert(sale);
  };

  return { sales, loading, add, refresh: fetch };
}

export function usePurchases() {
  const supabase = createClient();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('purchases').select('*').order('date', { ascending: false });
    setPurchases(data?.map(p => ({ ...p, items: p.items as any })) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel('purchases_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases' }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch, supabase]);

  const add = async (purchase: Omit<Purchase, 'id' | 'created_at'>) => {
    await supabase.from('purchases').insert(purchase);
  };

  return { purchases, loading, add, refresh: fetch };
}

export function useQuotations() {
  const supabase = createClient();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('quotations').select('*').order('date', { ascending: false });
    setQuotations(data?.map(q => ({ ...q, items: q.items as any })) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel('quotations_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotations' }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch, supabase]);

  const add = async (quotation: Omit<Quotation, 'id' | 'created_at'>) => {
    await supabase.from('quotations').insert(quotation);
  };

  const update = async (id: string, quotation: Partial<Quotation>) => {
    await supabase.from('quotations').update(quotation).eq('id', id);
  };

  const remove = async (id: string) => {
    await supabase.from('quotations').delete().eq('id', id);
  };

  return { quotations, loading, add, update, remove, refresh: fetch };
}

export function useLedger() {
  const supabase = createClient();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('ledger').select('*').order('date', { ascending: true });
    setEntries(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel('ledger_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ledger' }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch, supabase]);

  const add = async (entry: Omit<LedgerEntry, 'id' | 'created_at'>) => {
    await supabase.from('ledger').insert(entry);
  };

  return { entries, loading, add, refresh: fetch };
}

export function useExpenses() {
  const supabase = createClient();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('expenses').select('*').order('date', { ascending: false });
    setExpenses(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel('expenses_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch, supabase]);

  const add = async (expense: Omit<Expense, 'id' | 'created_at'>) => {
    await supabase.from('expenses').insert(expense);
  };

  const remove = async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id);
  };

  return { expenses, loading, add, remove, refresh: fetch };
}
