import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/storage/schema/*.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './.storage/dev.db',
  },
} satisfies Config;
