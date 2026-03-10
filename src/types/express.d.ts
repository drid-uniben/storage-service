declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      accountId?: string;
      apiKeyId?: string;
    }
  }
}

export {};
