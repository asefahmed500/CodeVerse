import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import File from "@/models/file";
import type { FileType } from "@/types";
import mongoose from "mongoose";

const findDescendants = async (fileId: mongoose.Types.ObjectId, userId: string): Promise<mongoose.Types.ObjectId[]> => {
    const descendants: mongoose.Types.ObjectId[] = [];
    const queue: mongoose.Types.ObjectId[] = [fileId];
    
    while(queue.length > 0) {
        const currentId = queue.shift()!;
        const children = await File.find({ parentId: currentId, userId });
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
        
        // Sanitize the files for the client, converting ObjectIds to strings
        const sanitizedFiles = files.map(file => ({
            ...file,
            _id: file._id.toString(),
            userId: file.userId.toString(),
            parentId: file.parentId ? file.parentId.toString() : null,
            // Ensure client-side fields are present
            isOpen: false,
            isActive: false,
        }));
        
        return NextResponse.json(sanitizedFiles);
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
            if (!mongoose.Types.ObjectId.isValid(sourceId)) {
                return NextResponse.json({ error: "Invalid source ID" }, { status: 400 });
            }

            const original = await File.findById(sourceId).lean();
            if (!original || original.userId.toString() !== userId) {
                return NextResponse.json({ error: "Original item not found or permission denied" }, { status: 404 });
            }

            const duplicateRecursively = async (node: any, parentId: string | null): Promise<any> => {
                const newId = new mongoose.Types.ObjectId();
                const siblingNames = (await File.find({ parentId: parentId, userId }).lean()).map(f => f.name);

                let newName = node.name;
                
                if (!node.isFolder) {
                    const extIndex = newName.lastIndexOf('.');
                    const baseName = extIndex !== -1 ? newName.substring(0, extIndex) : newName;
                    const extension = extIndex !== -1 ? newName.substring(extIndex) : '';
                    
                    let counter = 1;
                    let candidateName = `${baseName} copy${extension}`;
                    if(siblingNames.includes(candidateName)) {
                        while (siblingNames.includes(candidateName)) {
                            counter++;
                            candidateName = `${baseName} copy ${counter}${extension}`;
                        }
                    }
                    newName = candidateName;
                } else {
                     let counter = 1;
                    let candidateName = `${newName} copy`;
                    if(siblingNames.includes(candidateName)) {
                        while (siblingNames.includes(candidateName)) {
                            counter++;
                            candidateName = `${newName} copy ${counter}`;
                        }
                    }
                    newName = candidateName;
                }


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

                const newNodeDoc = await File.create(newNodeData);
                const newNode = newNodeDoc.toObject();

                if (node.isFolder) {
                    const children = await File.find({ parentId: node._id, userId });
                    newNode.children = [];
                    for (const child of children) {
                        const newChild = await duplicateRecursively(child.toObject(), newId.toString());
                        newNode.children.push(newChild);
                    }
                }
                 // Serialize the result correctly
                return {
                    ...newNode,
                    _id: newNode._id.toString(),
                    parentId: newNode.parentId ? newNode.parentId.toString() : null,
                };
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
                const savedObject = savedItem.toObject();


                if (item.isFolder) {
                    pathIdMap.set(item.path, savedItem._id.toString());
                }
                createdItems.push({ ...savedObject, _id: savedObject._id.toString(), parentId: savedObject.parentId?.toString() || null });
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
        const savedObject = newFile.toObject();
        return NextResponse.json({ ...savedObject, _id: savedObject._id.toString(), parentId: savedObject.parentId?.toString() || null }, { status: 201 });

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
        ).lean();

        if (!updatedFile) {
            return NextResponse.json({ error: "File not found or permission denied" }, { status: 404 });
        }
        return NextResponse.json({ ...updatedFile, _id: updatedFile._id.toString(), parentId: updatedFile.parentId?.toString() || null });
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
        
        let idsToDelete: mongoose.Types.ObjectId[] = [fileToDelete._id];
        
        // If it's a folder, recursively find all descendant IDs
        if (fileToDelete.isFolder) {
            const descendantIds = await findDescendants(fileToDelete._id, userId);
            idsToDelete = idsToDelete.concat(descendantIds);
        }

        const uniqueIds = [...new Set(idsToDelete.map(id => id.toString()))];
        await File.deleteMany({ _id: { $in: uniqueIds }, userId });

        return NextResponse.json({ message: "Deleted successfully", deletedIds: uniqueIds }, { status: 200 });
    } catch (error) {
        console.error("DELETE /api/files Error:", error);
        return NextResponse.json({ error: "Failed to delete file(s)" }, { status: 500 });
    }
}
