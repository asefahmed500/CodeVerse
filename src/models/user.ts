import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface IUser extends Document {
    name?: string;
    email: string;
    password?: string;
    image?: string;
    emailVerified?: Date;
}

const UserSchema: Schema = new Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
        unique: true,
        required: [true, 'Email is required.'],
        index: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
    },
    image: {
        type: String,
    },
    emailVerified: {
        type: Date,
    }
}, { timestamps: true });

const User: Model<IUser> = models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
