export class RedisKeyBuilder {
  static getLockKey(jobId: string): string {
    return `lock:${jobId}`;
  }

  static getJobOperatorKey(jobId: string): string {
    return `jobOperator:${jobId}`;
  }
}
