declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    RECORDS_ADMIN_EMAIL?: string;
    RECORDS_SHARED_EMAIL?: string;
  }
}
