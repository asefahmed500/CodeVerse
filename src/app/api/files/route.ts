import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/db";
import File from "@/models/file";
import type { FileType } from "@/types";
import mongoose from "mongoose";

// Helper function to build a tree from a flat list of files
const buildFileTree = (files: any[]): FileType[] => {
    const fileMap = new Map();
    const tree: FileType[] = [];

    files.forEach(file => {
        const fileDoc = file._doc ? file._doc : file;
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

    // Sort children alphabetically, folders first
    const sortChildren = (nodes: FileType[]) => {
      nodes.sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
      });
      nodes.forEach(node => {
        if (node.children) {
          sortChildren(node.children);
        }
      });
    };
    sortChildren(tree);

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
        const files = await File.find({ userId }).sort({ isFolder: -1, name: 1 }).lean();
        const tree = buildFileTree(files);
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

        if (action === 'duplicate') {
            const { sourceId } = await request.json();
            if (!mongoose.Types.ObjectId.isValid(sourceId)) {
                return NextResponse.json({ error: "Invalid source ID" }, { status: 400 });
            }

            const original = await File.findById(sourceId).lean();
            if (!original || original.userId.toString() !== userId) {
                return NextResponse.json({ error: "Original item not found or permission denied" }, { status: 404 });
            }

            // This map will store the mapping from old IDs to new IDs
            const idMap = new Map<string, string>();

            const duplicateRecursively = async (node: any, newParentId: string | null): Promise<any> => {
                const newId = new mongoose.Types.ObjectId();
                idMap.set(node._id.toString(), newId.toString());

                // Find all siblings to check for name collisions
                const siblings = await File.find({ parentId: newParentId, userId }).lean();
                const siblingNames = siblings.map(f => f.name);

                let newName = node.name;
                let counter = 1;
                let candidateName = newName;

                if (node.isFolder) {
                    candidateName = `${newName} copy`;
                    while(siblingNames.includes(candidateName)) {
                        counter++;
                        candidateName = `${newName} copy ${counter}`;
                    }
                } else {
                    const extIndex = newName.lastIndexOf('.');
                    const baseName = extIndex !== -1 ? newName.substring(0, extIndex) : newName;
                    const extension = extIndex !== -1 ? newName.substring(extIndex) : '';
                    candidateName = `${baseName} copy${extension}`;
                     while(siblingNames.includes(candidateName)) {
                        counter++;
                        candidateName = `${baseName} copy ${counter}${extension}`;
                    }
                }
                newName = candidateName;

                const newNodeData = {
                    ...node,
                    _id: newId,
                    userId,
                    parentId: newParentId ? new mongoose.Types.ObjectId(newParentId) : null,
                    name: newName,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                // Remove properties that should not be copied directly
                delete newNodeData.children;

                const newNodeDoc = await File.create(newNodeData);
                const resultNode = newNodeDoc.toObject();

                if (node.isFolder) {
                    resultNode.children = [];
                    const children = await File.find({ parentId: node._id, userId }).lean();
                    for (const child of children) {
                        const newChild = await duplicateRecursively(child, newId.toString());
                        resultNode.children.push(newChild);
                    }
                }

                // Serialize the result correctly
                return {
                    ...resultNode,
                    _id: resultNode._id.toString(),
                    parentId: resultNode.parentId ? resultNode.parentId.toString() : null,
                };
            };
            
            const duplicated = await duplicateRecursively(original, original.parentId ? original.parentId.toString() : null);
            return NextResponse.json(duplicated, { status: 201 });
        }


        if (action === 'bulkCreate') {
            const { items } = await request.json(); 
             await File.deleteMany({ userId }); 
            
            const createdItems = [];
            const pathIdMap = new Map<string, string>();
            items.sort((a: any, b: any) => a.path.localeCompare(b.path)); 

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
        updates.updatedAt = new Date();

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
