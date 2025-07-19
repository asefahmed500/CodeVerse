'use server';

import dbConnect from "@/lib/db";
import File from "@/models/file";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";

/**
 * Fetches a single file by its ID from the database for the authenticated user.
 * This is a server action intended for use in Server Components.
 */
export async function getFileById(id: string) {
  const session = await auth();
  if (!session || !(session.user as any)?.id) {
    return null; // Unauthorized
  }
  const userId = (session.user as any).id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  try {
    await dbConnect();
    // Secure the query by checking for ownership (userId)
    const file = await File.findOne({ _id: id, userId: userId }).lean();
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
