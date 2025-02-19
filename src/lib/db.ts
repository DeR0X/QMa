// IndexedDB wrapper for browser-compatible database operations
class Database {
  private dbName: string;
  private version: number;

  constructor(dbName: string = 'employeeDB', version: number = 1) {
    this.dbName = dbName;
    this.version = version;
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains('employees')) {
          db.createObjectStore('employees', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('departments')) {
          db.createObjectStore('departments', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('qualifications')) {
          db.createObjectStore('qualifications', { keyPath: 'id' });
        }
      };
    });
  }

  async executeQuery<T>(query: string, params: any[] = []): Promise<T[]> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['employees', 'departments', 'qualifications'], 'readonly');
      
      // Parse the query to determine which store to use and what operation to perform
      // This is a simplified example - in a real app, you'd want to implement proper SQL parsing
      const store = transaction.objectStore('employees');
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result as T[]);
      });
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async insert<T>(storeName: string, data: T): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.add(data);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async update<T>(storeName: string, data: T): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.openDB();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as T[]);
    });
  }

  async getById<T>(storeName: string, id: string): Promise<T | null> {
    const db = await this.openDB();
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as T || null);
    });
  }
}

// Create and export database instance
const db = new Database();
export const executeQuery = <T>(query: string, params: any[] = []): Promise<T[]> => {
  return db.executeQuery<T>(query, params);
};

export default db;