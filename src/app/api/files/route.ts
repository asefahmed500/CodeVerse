import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import File from "@/models/file";
import type { IFile } from "@/models/file";
import mongoose from "mongoose";

const findDescendants = async (fileId: mongoose.Types.ObjectId, userId: string): Promise<mongoose.Types.ObjectId[]> => {
    const descendants: mongoose.Types.ObjectId[] = [];
    const queue: mongoose.Types.ObjectId[] = [fileId];
    
    while(queue.length > 0) {
        const currentId = queue.shift()!;
        // Optimize projection to only get necessary fields
        const children = await File.find({ parentId: currentId, userId }, '_id isFolder');
        for (const child of children) {
            descendants.push(child._id);
            if (child.isFolder) {
                queue.push(child._id);
            }
        }
    }
    return descendants;
};

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
        
        // Sanitize files for client consumption, converting ObjectIDs to strings
        const sanitizedFiles = files.map(file => ({
            ...file,
            _id: file._id.toString(),
            userId: file.userId.toString(),
            parentId: file.parentId ? file.parentId.toString() : null,
        }));
        
        return NextResponse.json(sanitizedFiles);
    } catch (error) {
        console.error("GET /api/files Error:", error);
        return NextResponse.json({ error: "Failed to fetch files due to a server error." }, { status: 500 });
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

        if (action === 'duplicate') {
            const { sourceId } = await request.json();
            if (!mongoose.Types.ObjectId.isValid(sourceId)) {
                return NextResponse.json({ error: "Invalid source ID" }, { status: 400 });
            }

            const original = await File.findById(sourceId).lean();
            if (!original || original.userId.toString() !== userId) {
                return NextResponse.json({ error: "Original item not found or permission denied" }, { status: 404 });
            }

            const duplicateRecursively = async (node: any, newParentId: mongoose.Types.ObjectId | null): Promise<any> => {
                const newId = new mongoose.Types.ObjectId();
                const siblingNames = (await File.find({ parentId: newParentId, userId }).lean()).map(f => f.name);

                let newName = node.name;
                
                if (!node.isFolder) {
                    const extIndex = newName.lastIndexOf('.');
                    const baseName = extIndex !== -1 ? newName.substring(0, extIndex) : newName;
                    const extension = extIndex !== -1 ? newName.substring(extIndex) : '';
                    
                    let counter = 1;
                    let candidateName = `${baseName} copy${extension}`;
                    while (siblingNames.includes(candidateName)) {
                        counter++;
                        candidateName = `${baseName} copy ${counter}${extension}`;
                    }
                    newName = candidateName;
                } else {
                    let counter = 1;
                    let candidateName = `${newName} copy`;
                    while (siblingNames.includes(candidateName)) {
                        counter++;
                        candidateName = `${newName} copy ${counter}`;
                    }
                    newName = candidateName;
                }

                const newNodeData: Partial<IFile> = {
                    _id: newId,
                    userId: new mongoose.Types.ObjectId(userId),
                    parentId: newParentId,
                    name: newName,
                    content: node.content,
                    isFolder: node.isFolder,
                    language: node.language,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                
                const newNodeDoc = await File.create(newNodeData);
                const newNode = newNodeDoc.toObject();

                const resultNode = {
                    ...newNode,
                    _id: newNode._id.toString(),
                    parentId: newNode.parentId ? newNode.parentId.toString() : null,
                    children: [] as any[],
                };

                if (node.isFolder) {
                    const children = await File.find({ parentId: node._id, userId }).lean();
                    for (const child of children) {
                        const newChild = await duplicateRecursively(child, newNode._id);
                        resultNode.children.push(newChild);
                    }
                }

                return resultNode;
            };
            
            const duplicated = await duplicateRecursively(original, original.parentId);
            return NextResponse.json(duplicated, { status: 201 });
        }

        if (action === 'bulkCreate') {
            const { items } = await request.json(); 
            // Clear existing workspace before cloning a new one
            await File.deleteMany({ userId });
            
            const createdItems = [];
            const pathIdMap = new Map<string, string>();
            // Sort by path depth to ensure parents are created before children
            items.sort((a: any, b: any) => a.path.split('/').length - b.path.split('/').length); 

            for (const item of items) {
                const parts = item.path.split('/');
                const itemName = parts.pop();
                const parentPath = parts.join('/');
                const parentId = parentPath ? pathIdMap.get(parentPath) : null;
                
                const newItem = new File({
                    ...item,
                    name: itemName,
                    userId,
                    parentId: parentId ? new mongoose.Types.ObjectId(parentId) : null,
                });
                const savedItem = await newItem.save();
                const savedObject = savedItem.toObject();

                if (item.isFolder) {
                    pathIdMap.set(item.path, savedItem._id.toString());
                }
                createdItems.push({ ...savedObject, _id: savedObject._id.toString(), parentId: savedObject.parentId?.toString() || null });
            }
            return NextResponse.json(createdItems, { status: 201 });
        }
        
        // Default action: Create a single file/folder
        const fileData = await request.json();

        // Check for duplicate names in the same directory
        const existingFile = await File.findOne({ 
            name: fileData.name, 
            parentId: fileData.parentId || null, 
            userId 
        });
        if (existingFile) {
            return NextResponse.json({ error: `An item named "${fileData.name}" already exists in this folder.` }, { status: 409 });
        }

        const newFile = new File({
            ...fileData,
            userId,
        });
        await newFile.save();
        const savedObject = newFile.toObject();
        return NextResponse.json({ ...savedObject, _id: savedObject._id.toString(), parentId: savedObject.parentId?.toString() || null }, { status: 201 });

    } catch (error) {
        console.error("POST /api/files Error:", error);
        if (error instanceof mongoose.Error.ValidationError) {
            return NextResponse.json({ error: `Validation Error: ${error.message}` }, { status: 400 });
        }
        return NextResponse.json({ error: "Operation failed due to a server error." }, { status: 500 });
    }
}

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
        
        if (updates.name) {
            const fileToUpdate = await File.findById(fileId);
            if (!fileToUpdate) {
                return NextResponse.json({ error: "File not found." }, { status: 404 });
            }

            const existingWithSameName = await File.findOne({
                name: updates.name,
                parentId: fileToUpdate.parentId,
                userId,
                _id: { $ne: fileId }
            });
            
            if (existingWithSameName) {
                return NextResponse.json({ error: `An item named "${updates.name}" already exists.` }, { status: 409 });
            }
        }
        
        // Prevent client from updating internal/protected fields
        delete updates.isOpen;
        delete updates.isActive;
        delete updates.children;
        delete updates._id;
        delete updates.userId;

        updates.updatedAt = new Date();

        const updatedFile = await File.findOneAndUpdate(
            { _id: fileId, userId },
            { $set: updates },
            { new: true, runValidators: true }
        ).lean();

        if (!updatedFile) {
            return NextResponse.json({ error: "File not found or permission denied" }, { status: 404 });
        }
        
        // Return a minimal object to avoid overwriting client-side state
        const responseData = {
          _id: updatedFile._id.toString(),
          parentId: updatedFile.parentId?.toString() || null,
          name: updatedFile.name,
          content: updatedFile.content,
          isFolder: updatedFile.isFolder,
          language: updatedFile.language,
          createdAt: updatedFile.createdAt,
          updatedAt: updatedFile.updatedAt
        };

        return NextResponse.json(responseData);
    } catch (error) {
        console.error("PUT /api/files Error:", error);
        if (error instanceof mongoose.Error.ValidationError) {
            return NextResponse.json({ error: `Validation Error: ${error.message}` }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to update file due to a server error." }, { status: 500 });
    }
}

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
        
        const idsToDelete: mongoose.Types.ObjectId[] = [fileToDelete._id];
        
        if (fileToDelete.isFolder) {
            const descendantIds = await findDescendants(fileToDelete._id, userId);
            idsToDelete.push(...descendantIds);
        }

        const uniqueIds = [...new Set(idsToDelete.map(id => id.toString()))];
        await File.deleteMany({ _id: { $in: uniqueIds }, userId });

        return NextResponse.json({ message: "Deleted successfully", deletedIds: uniqueIds }, { status: 200 });
    } catch (error) {
        console.error("DELETE /api/files Error:", error);
        return NextResponse.json({ error: "Failed to delete file(s) due to a server error." }, { status: 500 });
    }
}
