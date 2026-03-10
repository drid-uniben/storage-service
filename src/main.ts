import { createApp } from './app';

async function bootstrap(): Promise<void> {
  const { app, prisma, config } = await createApp();

  const server = app.listen(config.port, () => {
    console.log(`Storage service listening on port ${config.port}`);
    console.log(`Storage root: ${config.storageRoot}`);
  });

  let isShuttingDown = false;

  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    console.log(`Received ${signal}, shutting down...`);

    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

void bootstrap();
