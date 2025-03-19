// Type declarations for zustand
declare module 'zustand' {
  export interface StoreApi<T> {
    getState: () => T;
    setState: (partial: Partial<T> | ((state: T) => Partial<T>), replace?: boolean) => void;
    subscribe: (listener: (state: T, prevState: T) => void) => () => void;
  }

  export type StateCreator<T> = (
    set: (partial: Partial<T> | ((state: T) => Partial<T>), replace?: boolean) => void,
    get: () => T,
    api: StoreApi<T>
  ) => T;

  export function create<T>(createState: StateCreator<T>): {
    (): T;
    <U>(selector: (state: T) => U, equals?: (a: U, b: U) => boolean): U;
  };
} 