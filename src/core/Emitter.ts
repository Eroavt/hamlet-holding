type Handler<T> = (payload: T) => void;

/**
 * Minimal typed event emitter. Deliberately allocation-free on emit —
 * it is used on the hot path.
 */
export class Emitter<Events extends Record<string, unknown>> {
  private map = new Map<keyof Events, Set<Handler<never>>>();

  on<K extends keyof Events>(type: K, fn: Handler<Events[K]>): () => void {
    let set = this.map.get(type);
    if (!set) {
      set = new Set();
      this.map.set(type, set);
    }
    set.add(fn as Handler<never>);
    return () => this.off(type, fn);
  }

  off<K extends keyof Events>(type: K, fn: Handler<Events[K]>): void {
    this.map.get(type)?.delete(fn as Handler<never>);
  }

  emit<K extends keyof Events>(type: K, payload: Events[K]): void {
    const set = this.map.get(type);
    if (!set) return;
    for (const fn of set) (fn as Handler<Events[K]>)(payload);
  }

  clear(): void {
    this.map.clear();
  }
}
