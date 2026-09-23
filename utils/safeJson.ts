// Safe JSON serialization and cycle-breaking utilities for Janu's Creations Studio

/**
 * Serializes an object to JSON while safely handling circular references,
 * React internal fiber nodes, and browser DOM elements (such as HTMLAudioElement).
 */
export function safeStringify(value: any, replacer?: any, space?: string | number): string {
  const seen = new WeakSet();

  const internalReplacer = (key: string, val: any) => {
    // 1. Omit React fiber internals and private instance nodes
    if (
      key &&
      (key.startsWith('__reactFiber') ||
        key.startsWith('__reactInternalInstance') ||
        key.startsWith('__reactContainer') ||
        key === 'stateNode' ||
        key === '_owner')
    ) {
      return undefined;
    }

    // 2. Omit browser DOM elements, windows, and audio/video elements
    if (typeof window !== 'undefined' && val) {
      if (
        val instanceof Node ||
        val instanceof Window ||
        val instanceof Document ||
        (typeof val === 'object' && typeof (val as any).nodeType === 'number')
      ) {
        return undefined;
      }
    }

    // 3. Cycle detection with WeakSet
    if (typeof val === 'object' && val !== null) {
      if (seen.has(val)) {
        return undefined; // Break circular reference
      }
      seen.add(val);
    }

    // 4. Delegate to custom replacer if provided
    if (typeof replacer === 'function') {
      return replacer(key, val);
    }

    return val;
  };

  try {
    return JSON.stringify(value, internalReplacer, space);
  } catch (err) {
    console.warn('safeStringify fallback caught serialization error:', err);
    try {
      // Fallback: strip object by simple keys
      if (typeof value === 'object' && value !== null) {
        const simple: Record<string, any> = {};
        for (const k of Object.keys(value)) {
          if (!k.startsWith('__react') && k !== 'stateNode') {
            const v = value[k];
            if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
              simple[k] = v;
            }
          }
        }
        return JSON.stringify(simple, null, space);
      }
    } catch {
      // Return empty JSON object on catastrophic serialization failure
    }
    return '{}';
  }
}

/**
 * Installs a transparent safeguard on global JSON.stringify so that any
 * unexpected circular structure (e.g. from HTMLAudioElement or React Fiber)
 * is automatically converted without throwing an unhandled TypeError exception.
 */
export function installSafeJsonGlobal(): void {
  if (typeof window === 'undefined') return;

  const originalStringify = JSON.stringify;
  if ((window as any).__safeJsonInstalled) return;
  (window as any).__safeJsonInstalled = true;

  (JSON as any).stringify = function (value: any, replacer: any, space: any) {
    try {
      return originalStringify(value, replacer, space);
    } catch (err: any) {
      if (err instanceof TypeError && typeof err.message === 'string' && err.message.toLowerCase().includes('circular')) {
        console.warn('Safe JSON guard caught circular structure, falling back cleanly:', err.message);
        return safeStringify(value, replacer, space);
      }
      throw err;
    }
  };
}
