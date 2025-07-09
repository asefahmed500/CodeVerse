import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import File from "@/models/file";
import type { FileType } from "@/types";
import mongoose from "mongoose";

// Helper function to build a tree from a flat list of files
const buildTree = (files: any[]): FileType[] => {
    const fileMap = new Map();
    const tree: FileType[] = [];

    files.forEach(file => {
        const fileDoc = file._doc ? file._doc : file; // Handle mongoose document weirdness
        const fileJSON = {
            ...fileDoc,
            _id: fileDoc._id.toString(),
            parentId: fileDoc.parentId ? fileDoc.parentId.toString() : null,
        }
        fileMap.set(fileJSON._id, { ...fileJSON, children: [] });
    });

    fileMap.forEach(file => {
        if (file.parentId && fileMap.has(file.parentId)) {
            const parent = fileMap.get(file.parentId);
            if (parent) {
                parent.children.push(file);
            }
        } else {
            tree.push(file);
        }
    });

    return tree;
}

// GET all files for a user
export async function GET(request: Request) {
    const session = await auth();
    if (!session || !(session.user as any)?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    try {
        await dbConnect();
        const files = await File.find({ userId }).lean();
        const tree = buildTree(files);
        return NextResponse.json(tree);
    } catch (error) {
        console.error("GET /api/files Error:", error);
        return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 });
    }
}

// POST to create a file/folder or perform bulk actions
export async function POST(request: Request) {
    const session = await auth();
    if (!session || !(session.user as any)?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    try {
        await dbConnect();

        // Handle duplicating a file or folder
        if (action === 'duplicate') {
            const { sourceId } = await request.json();
            const original = await File.findById(sourceId).lean();
            if (!original || original.userId.toString() !== userId) {
                return NextResponse.json({ error: "Original item not found or permission denied" }, { status: 404 });
            }

            const duplicateRecursively = async (node: any, parentId: string | null): Promise<any> => {
                const newId = new mongoose.Types.ObjectId();
                const siblingNames = (await File.find({ parentId: parentId, userId }).lean()).map(f => f.name);

                let newName = node.name;
                const extIndex = newName.lastIndexOf('.');
                const baseName = extIndex !== -1 ? newName.substring(0, extIndex) : newName;
                const extension = extIndex !== -1 ? newName.substring(extIndex) : '';
                
                let counter = 1;
                do {
                    newName = `${baseName}${counter > 1 ? ` copy ${counter}` : ' copy'}${extension}`;
                    counter++;
                } while (siblingNames.includes(newName));


                const newNodeData = {
                    ...node,
                    _id: newId,
                    userId,
                    parentId,
                    name: newName,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                delete newNodeData.children;

                const newNode = await File.create(newNodeData);
                if (node.isFolder) {
                    const children = await File.find({ parentId: node._id, userId });
                    for (const child of children) {
                        await duplicateRecursively(child.toObject(), newId.toString());
                    }
                }
                return newNode.toObject();
            };
            
            const duplicated = await duplicateRecursively(original, original.parentId ? original.parentId.toString() : null);
            return NextResponse.json(duplicated, { status: 201 });
        }

        // Handle bulk creation for repo cloning
        if (action === 'bulkCreate') {
            const { items } = await request.json(); // Expects an array of file objects
             await File.deleteMany({ userId }); // Clear existing workspace
            
            const createdItems = [];
            const pathIdMap = new Map<string, string>();
            items.sort((a: any, b: any) => a.path.localeCompare(b.path)); // Process parent dirs first

            for (const item of items) {
                const parts = item.path.split('/');
                const itemName = parts.pop();
                const parentPath = parts.join('/');
                const parentId = parentPath ? pathIdMap.get(parentPath) : null;
                
                const newItem = new File({
                    ...item,
                    name: itemName,
                    userId,
                    parentId,
                });
                const savedItem = await newItem.save();

                if (item.isFolder) {
                    pathIdMap.set(item.path, savedItem._id.toString());
                }
                createdItems.push(savedItem);
            }
            return NextResponse.json(createdItems, { status: 201 });
        }
        
        // Handle single file/folder creation
        const fileData = await request.json();
        const newFile = new File({
            ...fileData,
            userId,
        });
        await newFile.save();
        return NextResponse.json(newFile, { status: 201 });

    } catch (error) {
        console.error("POST /api/files Error:", error);
        return NextResponse.json({ error: "Operation failed" }, { status: 500 });
    }
}


// PUT to update a file/folder
export async function PUT(request: Request) {
    const session = await auth();
    if (!session || !(session.user as any)?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
        return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    try {
        await dbConnect();
        const updates = await request.json();
        // Ensure updatedAt is set
        updates.updatedAt = new Date();

        // The client manages these, so don't let them be overwritten
        delete updates.isOpen;
        delete updates.isActive;

        const updatedFile = await File.findOneAndUpdate(
            { _id: fileId, userId },
            { $set: updates },
            { new: true }
        );

        if (!updatedFile) {
            return NextResponse.json({ error: "File not found or permission denied" }, { status: 404 });
        }
        return NextResponse.json(updatedFile);
    } catch (error) {
        console.error("PUT /api/files Error:", error);
        return NextResponse.json({ error: "Failed to update file" }, { status: 500 });
    }
}

// DELETE a file/folder
export async function DELETE(request: Request) {
    const session = await auth();
    if (!session || !(session.user as any)?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const action = searchParams.get('action');

     if (action === 'resetAll') {
        try {
            await dbConnect();
            await File.deleteMany({ userId });
            return NextResponse.json({ message: "Workspace reset successfully" }, { status: 200 });
        } catch (error) {
            console.error("DELETE /api/files?action=resetAll Error:", error);
            return NextResponse.json({ error: "Failed to reset workspace" }, { status: 500 });
        }
    }


    if (!fileId) {
        return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    try {
        await dbConnect();
        const fileToDelete = await File.findOne({ _id: fileId, userId });
        if (!fileToDelete) {
            return NextResponse.json({ error: "File not found or permission denied" }, { status: 404 });
        }
        
        const idsToDelete: mongoose.Types.ObjectId[] = [];
        
        if (fileToDelete.isFolder) {
             const aggregateResult = await File.aggregate([
                { $match: { _id: new mongoose.Types.ObjectId(fileId) } },
                {
                    $graphLookup: {
                        from: 'files',
                        startWith: '$_id',
                        connectFromField: '_id',
                        connectToField: 'parentId',
                        as: 'descendants',
                        depthField: 'depth'
                    }
                },
                { $unwind: '$descendants' },
                { $replaceRoot: { newRoot: '$descendants' } }
            ]);
            idsToDelete.push(...aggregateResult.map(doc => doc._id));
        }
        idsToDelete.push(fileToDelete._id);

        const uniqueIds = [...new Set(idsToDelete.map(id => id.toString()))];
        await File.deleteMany({ _id: { $in: uniqueIds }, userId });

        return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("DELETE /api/files Error:", error);
        return NextResponse.json({ error: "Failed to delete file(s)" }, { status: 500 });
    }
}
