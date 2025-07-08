import { Schema, model, models } from "mongoose";

const TerminalSessionSchema = new Schema(
  {
    userId: { type: String, required: true },
    title: { type: String, default: "Terminal" },
    content: { type: String, default: "" },
    commands: { type: [String], default: [] },
    currentCommandIndex: { type: Number, default: -1 },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const TerminalSession =
  models.TerminalSession || model("TerminalSession", TerminalSessionSchema);
