import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number with commas for thousands, etc
 */
export function formatNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n)
}

/**
 * Creates a debounced function that delays invoking the provided function until after
 * the specified wait time has elapsed since the last time it was invoked.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function (...args: Parameters<T>): void {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

export const isDev = process.env.NODE_ENV === "development"

export function formatWalletAddress(address: string): string {
  if (!address) return "";
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceMonitor {
    if (typeof window === 'undefined') {
      // Server-side: create new instance each time
      return new PerformanceMonitor()
    }
    
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startTimer(operation: string): () => void {
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now()
    return () => {
      const end = typeof performance !== 'undefined' ? performance.now() : Date.now()
      const duration = end - start
      this.recordMetric(operation, duration)
    }
  }

  private recordMetric(operation: string, duration: number) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, [])
    }
    this.metrics.get(operation)!.push(duration)
    
    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`)
    }
    
    // Log all operations for debugging
    console.log(`Performance: ${operation} took ${duration.toFixed(2)}ms`)
  }

  getAverageTime(operation: string): number {
    const times = this.metrics.get(operation)
    if (!times || times.length === 0) return 0
    return times.reduce((a, b) => a + b, 0) / times.length
  }

  getMetrics(): Record<string, { avg: number; count: number; max: number }> {
    const result: Record<string, { avg: number; count: number; max: number }> = {}
    
    for (const [operation, times] of this.metrics.entries()) {
      result[operation] = {
        avg: this.getAverageTime(operation),
        count: times.length,
        max: Math.max(...times)
      }
    }
    
    return result
  }

  clearMetrics() {
    this.metrics.clear()
  }
}

// Utility function to measure async operations
export async function measureAsync<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const monitor = PerformanceMonitor.getInstance()
  const stopTimer = monitor.startTimer(operation)
  
  try {
    const result = await fn()
    return result
  } finally {
    stopTimer()
  }
}

// Utility function to measure sync operations
export function measureSync<T>(
  operation: string,
  fn: () => T
): T {
  const monitor = PerformanceMonitor.getInstance()
  const stopTimer = monitor.startTimer(operation)
  
  try {
    const result = fn()
    return result
  } finally {
    stopTimer()
  }
}
