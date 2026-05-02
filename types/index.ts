export type UserRole = 'super_admin' | 'admin' | 'user';

export interface Staff {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  category_id: string;
  unit: string;
  cost_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
  created_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  created_at?: string;
}

export interface Vendor {
  id: string;
  name: string;
  phone: string;
  address: string;
  created_at?: string;
}

export interface SaleItem {
  product_id: string;
  name: string;
  qty: number;
  price: number;
  cost: number;
  unit: string;
}

export interface Sale {
  id: string;
  invoice_no: string;
  date: string;
  customer_id: string | null;
  customer_name: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  discount_amount: number;
  total: number;
  profit: number;
  pay_mode: 'cash' | 'credit' | 'card';
  status: 'paid' | 'credit' | 'cancelled';
  from_quote_id?: string | null;
  created_by?: string | null;
  created_at?: string;
}

export interface PurchaseItem {
  product_id: string;
  name: string;
  qty: number;
  cost: number;
  unit: string;
}

export interface Purchase {
  id: string;
  po_no: string;
  date: string;
  vendor_id: string | null;
  vendor_name: string;
  items: PurchaseItem[];
  total: number;
  pay_mode: 'cash' | 'credit' | 'bank';
  notes?: string;
  created_by?: string | null;
  created_at?: string;
}

export interface QuotationItem {
  product_id: string;
  name: string;
  qty: number;
  price: number;
  cost: number;
  unit: string;
}

export interface Quotation {
  id: string;
  quote_no: string;
  date: string;
  customer_id: string | null;
  customer_name: string;
  items: QuotationItem[];
  subtotal: number;
  discount: number;
  discount_amount: number;
  total: number;
  status: 'pending' | 'approved' | 'converted' | 'rejected';
  notes?: string;
  sale_id?: string | null;
  created_by?: string | null;
  created_at?: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  type: 'customer' | 'vendor';
  party_id: string;
  description: string;
  debit: number;
  credit: number;
  ref: string;
  created_by?: string | null;
  created_at?: string;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  created_by?: string | null;
  created_at?: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details?: any;
  ip_address?: string | null;
  created_at?: string;
}

export type ExpenseCategory = 'Rent' | 'Utilities' | 'Salaries' | 'Transport' | 'Maintenance' | 'Miscellaneous' | 'Shop Supplies';
