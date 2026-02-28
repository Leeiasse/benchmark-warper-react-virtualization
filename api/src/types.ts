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

export interface PaginatedResponse {
  data: Transaction[];
  total: number;
  limit: number;
  offset: number;
}

export interface CursorResponse {
  data: Transaction[];
  nextCursor: string | null;
  hasMore: boolean;
}
