import Database from 'better-sqlite3';
import path from 'path';
import { Bookmark, Category, BookmarkCreateInput, BookmarkUpdateInput, CategoryCreateInput, SearchFilters, PaginationOptions } from '@/types';

const DB_PATH = path.join(process.cwd(), 'data', 'bookmarks.db');

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeDatabase();
  }
  return db;
}

function initializeDatabase() {
  if (!db) return;

  // Create categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      color TEXT DEFAULT '#3B82F6',
      emoji TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add emoji column if it doesn't exist (for migration)
  try {
    db.exec(`ALTER TABLE categories ADD COLUMN emoji TEXT`);
  } catch (error) {
    // Column might already exist, ignore error
  }

  // Create bookmarks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT,
      username TEXT,
      password TEXT,
      category_id INTEGER,
      is_private BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_bookmarks_category_id ON bookmarks(category_id);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_is_private ON bookmarks(is_private);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at);
  `);

  // Insert default categories if none exist
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (categoryCount.count === 0) {
    const insertCategory = db.prepare('INSERT INTO categories (name, color) VALUES (?, ?)');
    insertCategory.run('General', '#3B82F6');
    insertCategory.run('Work', '#10B981');
    insertCategory.run('Personal', '#F59E0B');
    insertCategory.run('Resources', '#8B5CF6');
  }
}

// Category operations
export function getAllCategories(): Category[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM categories ORDER BY name').all() as Category[];
}

export function createCategory(input: CategoryCreateInput): Category {
  const db = getDatabase();
  const stmt = db.prepare('INSERT INTO categories (name, color, emoji) VALUES (?, ?, ?)');
  const result = stmt.run(input.name, input.color || '#3B82F6', input.emoji || null);
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid) as Category;
}

export function updateCategory(id: number, input: Partial<CategoryCreateInput>): Category | null {
  const db = getDatabase();
  const updates: string[] = [];
  const values: unknown[] = [];

  if (input.name !== undefined) {
    updates.push('name = ?');
    values.push(input.name);
  }
  if (input.color !== undefined) {
    updates.push('color = ?');
    values.push(input.color);
  }
  if (input.emoji !== undefined) {
    updates.push('emoji = ?');
    values.push(input.emoji);
  }

  if (updates.length === 0) {
    return getCategoryById(id);
  }

  values.push(id);
  const stmt = db.prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...values as [string, ...unknown[]]);
  return getCategoryById(id);
}

export function deleteCategory(id: number): boolean {
  const db = getDatabase();
  // First, update bookmarks to remove category reference
  db.prepare('UPDATE bookmarks SET category_id = NULL WHERE category_id = ?').run(id);
  // Then delete the category
  const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getCategoryById(id: number): Category | null {
  const db = getDatabase();
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category | null;
}

// Bookmark operations
export function getAllBookmarks(filters?: SearchFilters, pagination?: PaginationOptions, includePrivate = false) {
  const db = getDatabase();

  let whereClause = includePrivate ? '' : 'WHERE b.is_private = 0';
  const params: unknown[] = [];

  if (filters) {
    const conditions: string[] = [];

    if (!includePrivate) {
      conditions.push('b.is_private = 0');
    }

    if (filters.query) {
      conditions.push('(b.title LIKE ? OR b.description LIKE ? OR b.url LIKE ?)');
      const searchTerm = `%${filters.query}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.category_id) {
      conditions.push('b.category_id = ?');
      params.push(filters.category_id);
    }

    if (filters.is_private !== undefined && includePrivate) {
      conditions.push('b.is_private = ?');
      params.push(filters.is_private ? 1 : 0);
    }

    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }
  }

  const sortBy = filters?.sort_by || 'created_at';
  const sortOrder = filters?.sort_order || 'desc';
  const orderClause = `ORDER BY b.${sortBy} ${sortOrder.toUpperCase()}`;

  const limit = pagination?.limit || 50;
  const offset = ((pagination?.page || 1) - 1) * limit;
  const limitClause = `LIMIT ? OFFSET ?`;

  const baseQuery = `
    FROM bookmarks b
    LEFT JOIN categories c ON b.category_id = c.id
    ${whereClause}
  `;

  // Get total count
  const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
  const total = (db.prepare(countQuery).get(...params) as { total: number }).total;

  // Get bookmarks
  const query = `
    SELECT
      b.*,
      c.name as category_name,
      c.color as category_color,
      c.emoji as category_emoji
    ${baseQuery}
    ${orderClause}
    ${limitClause}
  `;

  const bookmarks = db.prepare(query).all(...params, limit, offset) as Array<{
    id: number;
    title: string;
    url: string;
    description: string | null;
    username: string | null;
    password: string | null;
    category_id: number | null;
    is_private: number;
    created_at: string;
    updated_at: string;
    category_name: string | null;
    category_color: string | null;
    category_emoji: string | null;
  }>;

  const formattedBookmarks: Bookmark[] = bookmarks.map(row => ({
    id: row.id,
    title: row.title,
    url: row.url,
    description: row.description || undefined,
    username: row.username || undefined,
    password: row.password || undefined,
    category_id: row.category_id || undefined,
    is_private: Boolean(row.is_private),
    created_at: row.created_at,
    updated_at: row.updated_at,
    category: row.category_id ? {
      id: row.category_id,
      name: row.category_name!,
      color: row.category_color!,
      emoji: row.category_emoji || undefined,
      created_at: row.created_at
    } : undefined
  }));

  return {
    bookmarks: formattedBookmarks,
    total,
    page: pagination?.page || 1,
    totalPages: Math.ceil(total / limit)
  };
}

export function getBookmarkById(id: number, includePrivate = false): Bookmark | null {
  const db = getDatabase();
  const whereClause = includePrivate ? 'WHERE b.id = ?' : 'WHERE b.id = ? AND b.is_private = 0';

  const query = `
    SELECT
      b.*,
      c.name as category_name,
      c.color as category_color,
      c.emoji as category_emoji
    FROM bookmarks b
    LEFT JOIN categories c ON b.category_id = c.id
    ${whereClause}
  `;

  const row = db.prepare(query).get(id) as {
    id: number;
    title: string;
    url: string;
    description: string | null;
    username: string | null;
    password: string | null;
    category_id: number | null;
    is_private: number;
    created_at: string;
    updated_at: string;
    category_name: string | null;
    category_color: string | null;
    category_emoji: string | null;
  } | undefined;
  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    url: row.url,
    description: row.description || undefined,
    username: row.username || undefined,
    password: row.password || undefined,
    category_id: row.category_id || undefined,
    is_private: Boolean(row.is_private),
    created_at: row.created_at,
    updated_at: row.updated_at,
    category: row.category_id ? {
      id: row.category_id,
      name: row.category_name!,
      color: row.category_color!,
      emoji: row.category_emoji || undefined,
      created_at: row.created_at
    } : undefined
  };
}

export function createBookmark(input: BookmarkCreateInput): Bookmark {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO bookmarks (title, url, description, username, password, category_id, is_private)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    input.title,
    input.url,
    input.description || null,
    input.username || null,
    input.password || null,
    input.category_id || null,
    input.is_private ? 1 : 0
  );

  return getBookmarkById(result.lastInsertRowid as number, true)!;
}

export function updateBookmark(id: number, input: BookmarkUpdateInput): Bookmark | null {
  const db = getDatabase();
  const updates: string[] = [];
  const values: unknown[] = [];

  if (input.title !== undefined) {
    updates.push('title = ?');
    values.push(input.title);
  }
  if (input.url !== undefined) {
    updates.push('url = ?');
    values.push(input.url);
  }
  if (input.description !== undefined) {
    updates.push('description = ?');
    values.push(input.description);
  }
  if (input.username !== undefined) {
    updates.push('username = ?');
    values.push(input.username);
  }
  if (input.password !== undefined) {
    updates.push('password = ?');
    values.push(input.password);
  }
  if (input.category_id !== undefined) {
    updates.push('category_id = ?');
    values.push(input.category_id);
  }
  if (input.is_private !== undefined) {
    updates.push('is_private = ?');
    values.push(input.is_private ? 1 : 0);
  }

  if (updates.length === 0) {
    return getBookmarkById(id, true);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const stmt = db.prepare(`UPDATE bookmarks SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(...values as [string, ...unknown[]]);
  return getBookmarkById(id, true);
}

export function deleteBookmark(id: number): boolean {
  const db = getDatabase();
  const result = db.prepare('DELETE FROM bookmarks WHERE id = ?').run(id);
  return result.changes > 0;
}