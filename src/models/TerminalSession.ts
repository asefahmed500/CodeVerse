import { Schema, model, models } from "mongoose";

const TerminalSessionSchema = new Schema(
  {
    userId: { type: String, required: true },
    title: { type: String, default: "Terminal" },
    commands: { type: [String], default: [] },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const TerminalSession =
  models.TerminalSession || model("TerminalSession", TerminalSessionSchema);
