import path from 'path';

/**
 * Returns the writable storage root directory.
 * On serverless platforms (e.g. Vercel, AWS Lambda), the only writable filesystem
 * location is `/tmp`. On local development or traditional servers, defaults to `./.storage`.
 */
export function getStorageRoot(): string {
  if (process.env.SH_STORAGE_LOCAL_PATH) {
    return path.resolve(process.env.SH_STORAGE_LOCAL_PATH);
  }
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production') {
    return '/tmp/.storage';
  }
  return path.resolve('./.storage');
}
