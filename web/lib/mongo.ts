import { Db, MongoClient, ObjectId } from "mongodb";

declare global {
  var __mongoClient: Promise<MongoClient> | undefined;
}

export interface Inspection {
  _id?: ObjectId;
  booking_id: number;
  vehicle_id: number;
  type: "pickup" | "return";
  inspected_at: Date;
  fuel_level?: string;
  battery_percent?: number;
  odometer: number;
  damages: { part: string; severity: "minor" | "moderate" | "major"; note?: string; estimated_cost?: number }[];
  photos: string[];
}

export interface Review {
  _id?: ObjectId;
  booking_id: number;
  vehicle_id: number;
  customer_id: number;
  category_id: number;
  rating: number;
  comment: string;
  tags: string[];
  created_at: Date;
}

export function mongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

export async function getMongoDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local and fill it in.");
  if (!globalThis.__mongoClient) {
    globalThis.__mongoClient = new MongoClient(uri, { serverSelectionTimeoutMS: 4000 }).connect();
  }
  const client = await globalThis.__mongoClient;
  return client.db(process.env.MONGODB_DB ?? "urbandrive");
}
