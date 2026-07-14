export interface LocalStoreOptions<T> {
  key: string;
  defaultValue: T;
  eventName: string;
}

export interface LocalStore<T> {
  load(): T;
  save(data: T): void;
  clear(): void;
}

export function createLocalStore<T>(options: LocalStoreOptions<T>): LocalStore<T> {
  const { key, defaultValue, eventName } = options;

  function load(): T {
    if (typeof window === "undefined") return defaultValue;
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;
    try {
      const parsed = JSON.parse(raw);
      // 数组直接返回，对象则与 defaultValue 合并以补全缺失字段
      if (Array.isArray(defaultValue)) return parsed as T;
      return { ...defaultValue, ...parsed };
    } catch {
      return defaultValue;
    }
  }

  function save(data: T): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(data));
  }

  function clear(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
    window.dispatchEvent(new Event(eventName));
  }

  return { load, save, clear };
}
