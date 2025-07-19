import mongoose, { Schema, Document, models, Model } from 'mongoose';

export interface IFile extends Document {
    name: string;
    content: string;
    isFolder: boolean;
    language: string;
    userId: mongoose.Types.ObjectId;
    parentId?: mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const FileSchema: Schema = new Schema({
    name: {
        type: String,
        required: [true, 'File name is required.'],
        trim: true,
    },
    content: {
        type: String,
        default: '',
    },
    isFolder: {
        type: Boolean,
        default: false,
    },
    language: {
        type: String,
        default: 'plaintext',
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    parentId: {
        type: Schema.Types.ObjectId,
        ref: 'File',
        default: null,
        index: true,
    },
}, { timestamps: true });

// Compound index to ensure unique names within a folder for a user
FileSchema.index({ parentId: 1, userId: 1, name: 1 }, { unique: true });

const File: Model<IFile> = models.File || mongoose.model<IFile>('File', FileSchema);

export default File;
