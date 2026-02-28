export interface Transaction {
  id: number;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  merchant: string;
  category: string;
  metadata: Record<string, string | number>;
  created_at: string;
}
