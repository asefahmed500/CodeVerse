import { Schema, model, models } from "mongoose";

const FileSchema = new Schema(
  {
    name: { type: String, required: true },
    content: { type: String, default: "" },
    isFolder: { type: Boolean, default: false },
    parentId: { type: Schema.Types.ObjectId, ref: "File", default: null },
    userId: { type: String, required: true },
    language: { type: String, default: "plaintext" },
    isOpen: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    children: [{ type: Schema.Types.ObjectId, ref: "File" }],
  },
  { timestamps: true }
);

export const File = models.File || model("File", FileSchema);
