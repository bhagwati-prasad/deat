/**
 * Performance Utilities
 * 
 * Optimization helpers for improving system performance.
 * See: IMPLEMENTATION_PLAN.md - Phase 7.2
 * See: doc/arch/core.md
 */

/**
 * Debounce function calls to reduce frequency
 * Useful for renderer updates that don't need to happen on every event
 * 
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay = 16) {
  let timeoutId = null;
  
  return function debounced(...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle function calls to limit execution rate
 * Ensures function runs at most once per interval
 * 
 * @param {Function} fn - Function to throttle
 * @param {number} interval - Minimum interval between calls in ms
 * @returns {Function} Throttled function
 */
export function throttle(fn, interval = 16) {
  let lastCall = 0;
  let timeoutId = null;
  
  return function throttled(...args) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;
    
    if (timeSinceLastCall >= interval) {
      lastCall = now;
      fn.apply(this, args);
    } else if (!timeoutId) {
      // Schedule next call
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn.apply(this, args);
        timeoutId = null;
      }, interval - timeSinceLastCall);
    }
  };
}

/**
 * Memoize function results to avoid repeated computation
 * 
 * @param {Function} fn - Function to memoize
 * @param {Function} keyFn - Optional function to generate cache key
 * @returns {Function} Memoized function
 */
export function memoize(fn, keyFn = (...args) => JSON.stringify(args)) {
  const cache = new Map();
  
  return function memoized(...args) {
    const key = keyFn(...args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    
    // Limit cache size to prevent memory leaks
    if (cache.size > 1000) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  };
}

/**
 * Batch multiple operations together to reduce event emissions
 * 
 * @param {Function} fn - Function that performs the batch operation
 * @param {number} delay - Delay before executing batch
 * @returns {Function} Batched function
 */
export function batch(fn, delay = 0) {
  let queue = [];
  let timeoutId = null;
  
  return function batched(item) {
    queue.push(item);
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      if (queue.length > 0) {
        fn.call(this, queue);
        queue = [];
      }
      timeoutId = null;
    }, delay);
  };
}

/**
 * Create an indexed lookup for faster queries
 * Builds Map-based indexes on specified fields
 * 
 * @param {Array} items - Items to index
 * @param {string|Array<string>} fields - Field(s) to index by
 * @returns {Object} Index object with get/getAll methods
 */
export function createIndex(items, fields) {
  const fieldArray = Array.isArray(fields) ? fields : [fields];
  const indexes = new Map();
  
  // Build indexes
  fieldArray.forEach(field => {
    const index = new Map();
    
    items.forEach(item => {
      const value = getNestedProperty(item, field);
      
      if (value !== undefined) {
        if (!index.has(value)) {
          index.set(value, []);
        }
        index.get(value).push(item);
      }
    });
    
    indexes.set(field, index);
  });
  
  return {
    /**
     * Get items by field value
     * 
     * @param {string} field - Field name
     * @param {*} value - Value to match
     * @returns {Array} Matching items
     */
    get(field, value) {
      const index = indexes.get(field);
      return index ? (index.get(value) || []) : [];
    },
    
    /**
     * Get all indexed values for a field
     * 
     * @param {string} field - Field name
     * @returns {Array} All values
     */
    getAll(field) {
      const index = indexes.get(field);
      return index ? Array.from(index.keys()) : [];
    },
    
    /**
     * Rebuild index with new items
     * 
     * @param {Array} newItems - New items to index
     */
    rebuild(newItems) {
      indexes.clear();
      return createIndex(newItems, fieldArray);
    }
  };
}

/**
 * Get nested property value from object
 * 
 * @param {Object} obj - Object to query
 * @param {string} path - Dot-notation path (e.g., 'metadata.title')
 * @returns {*} Property value or undefined
 */
function getNestedProperty(obj, path) {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

/**
 * LRU Cache for query results and computed values
 * Automatically evicts least recently used items when capacity is reached
 */
export class LRUCache {
  constructor(capacity = 100) {
    this.capacity = capacity;
    this.cache = new Map();
  }
  
  /**
   * Get value from cache
   * 
   * @param {string} key - Cache key
   * @returns {*} Cached value or undefined
   */
  get(key) {
    if (!this.cache.has(key)) {
      return undefined;
    }
    
    // Move to end (most recently used)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    
    return value;
  }
  
  /**
   * Put value in cache
   * 
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   */
  put(key, value) {
    // Delete if exists (will re-add at end)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // Evict least recently used if at capacity
    if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, value);
  }
  
  /**
   * Check if key exists in cache
   * 
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.cache.has(key);
  }
  
  /**
   * Clear all cached values
   */
  clear() {
    this.cache.clear();
  }
  
  /**
   * Get current cache size
   * 
   * @returns {number}
   */
  size() {
    return this.cache.size;
  }
}

/**
 * Virtual scrolling helper for rendering large lists
 * Only renders visible items + buffer
 * 
 * @param {Array} items - All items
 * @param {Object} viewport - Viewport dimensions { height, scrollTop }
 * @param {number} itemHeight - Height of each item
 * @param {number} buffer - Number of items to render outside viewport
 * @returns {Object} { visibleItems, startIndex, endIndex }
 */
export function getVisibleItems(items, viewport, itemHeight, buffer = 5) {
  const { height, scrollTop } = viewport;
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + height) / itemHeight) + buffer
  );
  
  return {
    visibleItems: items.slice(startIndex, endIndex),
    startIndex,
    endIndex,
    offsetY: startIndex * itemHeight,
    totalHeight: items.length * itemHeight
  };
}

/**
 * Request animation frame utility with cancellation
 * 
 * @param {Function} fn - Function to run on next frame
 * @returns {Function} Cancel function
 */
export function onNextFrame(fn) {
  const id = requestAnimationFrame(fn);
  return () => cancelAnimationFrame(id);
}

/**
 * Pool objects to avoid repeated allocation/deallocation
 */
export class ObjectPool {
  constructor(factory, reset, initialSize = 10) {
    this.factory = factory;
    this.reset = reset;
    this.available = [];
    
    // Pre-allocate
    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory());
    }
  }
  
  /**
   * Acquire object from pool
   * 
   * @returns {Object}
   */
  acquire() {
    if (this.available.length === 0) {
      return this.factory();
    }
    return this.available.pop();
  }
  
  /**
   * Release object back to pool
   * 
   * @param {Object} obj - Object to release
   */
  release(obj) {
    this.reset(obj);
    this.available.push(obj);
  }
  
  /**
   * Get pool statistics
   * 
   * @returns {Object} { available, size }
   */
  stats() {
    return {
      available: this.available.length,
      size: this.available.length
    };
  }
}

/**
 * Compress event history by merging consecutive similar events
 * Reduces memory usage for long undo/redo stacks
 * 
 * @param {Array} events - Event history
 * @param {Function} canMerge - Function to determine if two events can merge
 * @param {Function} merge - Function to merge two events
 * @returns {Array} Compressed events
 */
export function compressEvents(events, canMerge, merge) {
  if (events.length === 0) return [];
  
  const compressed = [events[0]];
  
  for (let i = 1; i < events.length; i++) {
    const current = events[i];
    const last = compressed[compressed.length - 1];
    
    if (canMerge(last, current)) {
      compressed[compressed.length - 1] = merge(last, current);
    } else {
      compressed.push(current);
    }
  }
  
  return compressed;
}

/**
 * Lazy evaluation wrapper
 * Defers computation until value is actually needed
 * 
 * @param {Function} fn - Function to compute value
 * @returns {Function} Getter function
 */
export function lazy(fn) {
  let computed = false;
  let value;
  
  return function get() {
    if (!computed) {
      value = fn();
      computed = true;
    }
    return value;
  };
}
