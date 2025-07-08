import { Schema, model, models } from "mongoose"

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String },
    lastLogin: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export const User = models.User || model("User", UserSchema)
