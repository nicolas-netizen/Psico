type CacheItem<T> = {
  value: T;
  timestamp: number;
};

class Cache {
  private static instance: Cache;
  private storage: Map<string, CacheItem<any>>;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos en milisegundos

  private constructor() {
    this.storage = new Map();
  }

  static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  set<T>(key: string, value: T, ttl: number = this.DEFAULT_TTL): void {
    this.storage.set(key, {
      value,
      timestamp: Date.now() + ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.storage.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.timestamp) {
      this.storage.delete(key);
      return null;
    }

    return item.value as T;
  }

  has(key: string): boolean {
    return this.storage.has(key) && Date.now() <= this.storage.get(key)!.timestamp;
  }

  delete(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }

  // Limpiar entradas caducadas
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.storage.entries()) {
      if (now > item.timestamp) {
        this.storage.delete(key);
      }
    }
  }
}

export const cache = Cache.getInstance();

// Decorador para cachear métodos
export function Cached(ttl?: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = `${propertyKey}-${JSON.stringify(args)}`;
      const cachedResult = cache.get(key);

      if (cachedResult !== null) {
        return cachedResult;
      }

      const result = await originalMethod.apply(this, args);
      cache.set(key, result, ttl);
      return result;
    };

    return descriptor;
  };
}
