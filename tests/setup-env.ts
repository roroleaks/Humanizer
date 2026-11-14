import os from 'os';
import path from 'path';

if (!process.env.SH_STORAGE_LOCAL_PATH) {
  process.env.SH_STORAGE_LOCAL_PATH = path.resolve(os.tmpdir(), `sh-test-${process.pid}`);
}
if (!process.env.SH_DATABASE_SQLITE_PATH) {
  process.env.SH_DATABASE_SQLITE_PATH = path.resolve(process.env.SH_STORAGE_LOCAL_PATH, 'test.db');
}
