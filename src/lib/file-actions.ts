
'use server';

import dbConnect from "@/lib/db";
import File from "@/models/file";
import mongoose from "mongoose";

/**
 * Fetches a single file by its ID from the database.
 * This is a server action intended for use in Server Components.
 */
export async function getFileById(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  try {
    await dbConnect();
    const file = await File.findById(id).lean();
    if (!file) {
      return null;
    }
    // Convert ObjectId instances to strings for serialization
    return JSON.parse(JSON.stringify(file));
  } catch (error) {
    console.error("Error fetching file by ID:", error);
    return null;
  }
}
