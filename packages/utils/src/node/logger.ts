import process from "node:process";

/**
 * Custom logger implementation that writes to standard output/error streams.
 * This is designed to replace console.log and consola in the codebase,
 * making it easier to snapshot std output in tests.
 */

export type LogLevel = "debug" | "info" | "success" | "warn" | "error";

// ANSI color codes for terminal output
export const colors = {
  reset: "\x1B[0m",
  bright: "\x1B[1m",
  dim: "\x1B[2m",
  black: "\x1B[30m",
  red: "\x1B[31m",
  green: "\x1B[32m",
  yellow: "\x1B[33m",
  blue: "\x1B[34m",
  magenta: "\x1B[35m",
  cyan: "\x1B[36m",
  white: "\x1B[37m",
  bgBlack: "\x1B[40m",
  bgRed: "\x1B[41m",
  bgGreen: "\x1B[42m",
  bgYellow: "\x1B[43m",
  bgBlue: "\x1B[44m",
  bgMagenta: "\x1B[45m",
  bgCyan: "\x1B[46m",
  bgWhite: "\x1B[47m",
};

export interface LoggerOptions {
  /**
   * Prefix to prepend to all log messages
   * @default ""
   */
  prefix?: string;

  /**
   * Whether to include timestamps in log messages
   * @default false
   */
  timestamp?: boolean;

  /**
   * Whether to use colors in log output
   * @default true (unless NO_COLOR environment variable is set)
   */
  colors?: boolean;
}

/**
 * Custom logger implementation with the ability to write to stdout/stderr
 */
export class Logger {
  private prefix: string;
  private timestamp: boolean;
  private useColors: boolean;

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix ?? "";
    this.timestamp = options.timestamp ?? false;
    this.useColors = options.colors ?? true;
  }

  /**
   * Format a log message with optional prefix and timestamp
   */
  private format(message: string, levelPrefix?: string, levelColor?: string): string {
    const parts: string[] = [];
    const resetColor = this.useColors ? colors.reset : "";

    if (this.timestamp) {
      const timestamp = `[${new Date().toISOString()}]`;
      parts.push(this.useColors ? `${colors.dim}${timestamp}${resetColor}` : timestamp);
    }

    if (this.prefix) {
      const prefix = `[${this.prefix}]`;
      parts.push(this.useColors ? `${colors.cyan}${prefix}${resetColor}` : prefix);
    }

    // Handle level prefix coloring separately
    if (levelPrefix && this.useColors && levelColor) {
      parts.push(`${levelColor}${levelPrefix}${resetColor} ${message}`);
    }
    else if (levelPrefix) {
      parts.push(`${levelPrefix} ${message}`);
    }
    else {
      parts.push(message);
    }

    return parts.join(" ");
  }

  /**
   * Write to stdout
   */
  private writeStdout(message: string): void {
    process.stdout.write(`${message}\n`);
  }

  /**
   * Write to stderr
   */
  private writeStderr(message: string): void {
    process.stderr.write(`${message}\n`);
  }

  /**
   * Log debug level message
   */
  debug(message: string, ...args: any[]): void {
    this.writeStdout(this.format(message, "DEBUG:", colors.dim));
    if (args.length > 0) {
      args.forEach((arg) => {
        if (typeof arg === "object") {
          this.writeStdout(JSON.stringify(arg, null, 2));
        }
        else {
          this.writeStdout(String(arg));
        }
      });
    }
  }

  /**
   * Log info level message
   */
  info(message: string, ...args: any[]): void {
    this.writeStdout(this.format(message, "INFO:", colors.blue));
    if (args.length > 0) {
      args.forEach((arg) => {
        if (typeof arg === "object") {
          this.writeStdout(JSON.stringify(arg, null, 2));
        }
        else {
          this.writeStdout(String(arg));
        }
      });
    }
  }

  /**
   * Log success level message
   */
  success(message: string, ...args: any[]): void {
    this.writeStdout(this.format(message, "SUCCESS:", colors.green));
    if (args.length > 0) {
      args.forEach((arg) => {
        if (typeof arg === "object") {
          this.writeStdout(JSON.stringify(arg, null, 2));
        }
        else {
          this.writeStdout(String(arg));
        }
      });
    }
  }

  /**
   * Log warning level message
   */
  warn(message: string, ...args: any[]): void {
    this.writeStderr(this.format(message, "WARN:", colors.yellow));
    if (args.length > 0) {
      args.forEach((arg) => {
        if (typeof arg === "object") {
          this.writeStderr(JSON.stringify(arg, null, 2));
        }
        else {
          this.writeStderr(String(arg));
        }
      });
    }
  }

  /**
   * Log error level message
   */
  error(message: string, ...args: any[]): void {
    this.writeStderr(this.format(message, "ERROR:", colors.red));
    if (args.length > 0) {
      args.forEach((arg) => {
        if (typeof arg === "object") {
          this.writeStderr(JSON.stringify(arg, null, 2));
        }
        else {
          this.writeStderr(String(arg));
        }
      });
    }
  }

  /**
   * Log plain message without level prefix
   */
  log(message: string, ...args: any[]): void {
    this.writeStdout(this.format(message));
    if (args.length > 0) {
      args.forEach((arg) => {
        if (typeof arg === "object") {
          this.writeStdout(JSON.stringify(arg, null, 2));
        }
        else {
          this.writeStdout(String(arg));
        }
      });
    }
  }

  /**
   * Create a new logger instance with the specified prefix
   */
  withPrefix(prefix: string): Logger {
    return new Logger({
      prefix: this.prefix ? `${this.prefix}:${prefix}` : prefix,
      timestamp: this.timestamp,
      colors: this.useColors,
    });
  }

  /**
   * Enable or disable colors
   */
  setColors(enabled: boolean): Logger {
    this.useColors = enabled;
    return this;
  }

  /**
   * Check if colors are enabled
   */
  hasColors(): boolean {
    return this.useColors;
  }
}

/**
 * Create a default logger instance
 * @param options Logger options
 * @returns A new Logger instance
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  // Check for NO_COLOR environment variable (standard for disabling colors)
  const noColorEnv = typeof process !== "undefined" && process.env.NO_COLOR !== undefined;
  const colorDefault = !noColorEnv;

  return new Logger({
    ...options,
    colors: options.colors ?? colorDefault,
  });
}

// Default logger instance
export const logger: Logger = createLogger();
