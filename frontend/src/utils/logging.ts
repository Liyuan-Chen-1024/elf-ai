/**
 * Enhanced logging utilities for the application
 */

const isDev = import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true';
const isVerbose = import.meta.env.VITE_VERBOSE === 'true';

/**
 * Logger class with methods for different log levels
 */
class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  /**
   * Log a debug message (only in development or debug mode)
   */
  debug(...args: any[]): void {
    if (isDev) {
      console.log(`[DEBUG][${this.context}]`, ...args);
    }
  }

  /**
   * Log an info message (only in development, debug mode, or if verbose)
   */
  info(...args: any[]): void {
    if (isDev || isVerbose) {
      console.info(`[INFO][${this.context}]`, ...args);
    }
  }

  /**
   * Log a warning message
   */
  warn(...args: any[]): void {
    console.warn(`[WARN][${this.context}]`, ...args);
  }

  /**
   * Log an error message
   */
  error(...args: any[]): void {
    console.error(`[ERROR][${this.context}]`, ...args);
  }

  /**
   * Log the start of a performance measurement
   */
  time(label: string): void {
    if (isDev) {
      console.time(`[${this.context}] ${label}`);
    }
  }

  /**
   * Log the end of a performance measurement
   */
  timeEnd(label: string): void {
    if (isDev) {
      console.timeEnd(`[${this.context}] ${label}`);
    }
  }

  /**
   * Group log messages together
   */
  group(label: string): void {
    if (isDev) {
      console.group(`[${this.context}] ${label}`);
    }
  }

  /**
   * End a group of log messages
   */
  groupEnd(): void {
    if (isDev) {
      console.groupEnd();
    }
  }
}

/**
 * Create a logger instance for a specific context
 */
export const createLogger = (context: string): Logger => {
  return new Logger(context);
};

/**
 * Global application logger
 */
export const logger = createLogger('App');

export default createLogger; 