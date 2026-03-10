import path from 'path';
import { HttpError } from '../errors/http-error';

export interface StoragePathResult {
  absolutePath: string;
  relativePath: string;
}

export function resolveStoragePath(
  storageRoot: string,
  accountId: string,
  objectKey: string,
): StoragePathResult {
  const normalizedKey = path.posix
    .normalize(`/${objectKey}`)
    .replace(/^\/+/, '');

  if (!normalizedKey || normalizedKey.startsWith('..')) {
    throw new HttpError(400, 'Invalid objectKey path.');
  }

  const accountRoot = path.resolve(storageRoot, accountId);
  const absolutePath = path.resolve(accountRoot, normalizedKey);

  if (
    absolutePath !== accountRoot &&
    !absolutePath.startsWith(`${accountRoot}${path.sep}`)
  ) {
    throw new HttpError(400, 'Invalid objectKey path.');
  }

  const relativePath = path.posix.join(accountId, normalizedKey);
  return { absolutePath, relativePath };
}
