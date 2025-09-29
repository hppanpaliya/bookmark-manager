export interface Category {
  id: number;
  name: string;
  color: string;
  emoji?: string;
  created_at: string;
}

export interface Bookmark {
  id: number;
  title: string;
  url: string;
  description?: string;
  username?: string;
  password?: string;
  category_id?: number;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface BookmarkCreateInput {
  title: string;
  url: string;
  description?: string;
  username?: string;
  password?: string;
  category_id?: number;
  is_private?: boolean;
}

export interface BookmarkUpdateInput {
  title?: string;
  url?: string;
  description?: string;
  username?: string;
  password?: string;
  category_id?: number;
  is_private?: boolean;
}

export interface CategoryCreateInput {
  name: string;
  color?: string;
  emoji?: string;
}

export interface SearchFilters {
  query?: string;
  category_id?: number;
  is_private?: boolean;
  sort_by?: 'created_at' | 'title' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface BookmarkListResponse {
  bookmarks: Bookmark[];
  total: number;
  page: number;
  totalPages: number;
}