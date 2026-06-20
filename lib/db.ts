import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

// Next.js reloads modules a lot in dev, so we cache the connection on the
// global object — otherwise every file change would open a new connection.
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var _mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cache;

export async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from your .env.local file");
  }

  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI);
  }

  cache.conn = await cache.promise;
  return cache.conn;
}