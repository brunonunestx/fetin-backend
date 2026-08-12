import { AsyncLocalStorage } from 'node:async_hooks';

interface RequestStore {
  correlationId: string;
}

const storage = new AsyncLocalStorage<RequestStore>();

export class RequestContext {
  static run<T>(store: RequestStore, callback: () => T): T {
    return storage.run(store, callback);
  }

  static get correlationId(): string | undefined {
    return storage.getStore()?.correlationId;
  }
}
