import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import { RequestContext } from '../context/request-context';

const SENSITIVE_KEYS = ['password', 'token', 'authorization', 'secret'];

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) =>
        SENSITIVE_KEYS.includes(key.toLowerCase())
          ? [key, '[REDACTED]']
          : [key, sanitize(val)],
      ),
    );
  }
  return value;
}

@Injectable()
export class JsonLoggerService implements LoggerService {
  private write(
    level: LogLevel,
    message: unknown,
    context?: string,
    extra?: unknown,
  ) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      correlationId: RequestContext.correlationId,
      message,
      ...(extra !== undefined ? { extra: sanitize(extra) } : {}),
    };
    process.stdout.write(JSON.stringify(entry) + '\n');
  }

  log(message: unknown, context?: string) {
    this.write('log', message, context);
  }

  error(message: unknown, trace?: string, context?: string) {
    this.write('error', message, context, trace ? { trace } : undefined);
  }

  warn(message: unknown, context?: string) {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: string) {
    this.write('debug', message, context);
  }

  verbose(message: unknown, context?: string) {
    this.write('verbose', message, context);
  }
}
