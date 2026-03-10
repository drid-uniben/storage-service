export class InMemoryRateLimiter {
  private readonly counter = new Map<string, number>();

  isAllowed(key: string, maxPerMinute: number): boolean {
    if (maxPerMinute <= 0) {
      return true;
    }

    const minuteBucket = Math.floor(Date.now() / 60000);
    const bucketKey = `${key}:${minuteBucket}`;
    const current = this.counter.get(bucketKey) ?? 0;
    const next = current + 1;
    this.counter.set(bucketKey, next);

    if (Math.random() < 0.01) {
      const oldestAllowedBucket = minuteBucket - 2;
      for (const existingKey of this.counter.keys()) {
        const parts = existingKey.split(':');
        const suffix = Number(parts[parts.length - 1]);
        if (!Number.isNaN(suffix) && suffix < oldestAllowedBucket) {
          this.counter.delete(existingKey);
        }
      }
    }

    return next <= maxPerMinute;
  }
}
