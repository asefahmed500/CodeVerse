import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { File } from "@/models/File"
import dbConnect from "@/lib/db"

export async function GET() {
  await dbConnect()
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const files = await File.find({ 
      userId: (session.user as any).id,
      parentId: null 
    }).populate({
      path: 'children',
      populate: {
        path: 'children',
        populate: {
            path: 'children'
        }
      }
    });

    return NextResponse.json(files)
  } catch (error) {
    console.error("Failed to fetch files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" }, 
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  await dbConnect()
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, isFolder, parentId, language, isOpen } = await request.json()
  const userId = (session.user as any).id;

  try {
    const existingFile = await File.findOne({
      name,
      parentId: parentId || null,
      userId,
    });

    if (existingFile) {
      return NextResponse.json(
        { error: `A ${existingFile.isFolder ? 'folder' : 'file'} with the name "${name}" already exists.` }, 
        { status: 409 }
      );
    }

    const newFile = new File({
      name,
      isFolder,
      parentId: parentId || null,
      userId,
      language: isFolder ? undefined : (language || "plaintext"),
      isActive: !isFolder,
      isOpen: isFolder ? false : isOpen,
    })

    await newFile.save()

    if (parentId) {
      await File.findByIdAndUpdate(parentId, {
        $push: { children: newFile._id }
      })
    }

    if (!isFolder) {
      await File.updateMany(
        { 
          userId,
          isActive: true,
          _id: { $ne: newFile._id }
        },
        { isActive: false }
      )
    }

    return NextResponse.json(newFile)
  } catch (error) {
    console.error("Failed to create file:", error);
    return NextResponse.json(
      { error: "Failed to create file" }, 
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  await dbConnect()
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { fileId, content, name, isOpen, isActive } = await request.json()

  try {
    const updates: any = { updatedAt: new Date() }
    if (content !== undefined) updates.content = content
    if (name !== undefined) updates.name = name
    if (isOpen !== undefined) updates.isOpen = isOpen
    if (isActive !== undefined) updates.isActive = isActive

    if (isActive) {
      await File.updateMany(
        { 
          userId: (session.user as any).id,
          isActive: true,
          _id: { $ne: fileId }
        },
        { isActive: false }
      )
    }

    const updatedFile = await File.findOneAndUpdate(
      { _id: fileId, userId: (session.user as any).id },
      { $set: updates },
      { new: true }
    )

    if (!updatedFile) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    return NextResponse.json(updatedFile)
  } catch (error) {
    console.error("Failed to update file:", error);
    return NextResponse.json(
      { error: "Failed to update file" }, 
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  await dbConnect()
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { fileId } = await request.json()
  const userId = (session.user as any).id;

  try {
    const file = await File.findOne({ _id: fileId, userId: userId })
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }
    
    const deleteChildren = async (folderId: string) => {
        const children = await File.find({ parentId: folderId });
        for (const child of children) {
            if (child.isFolder) {
                await deleteChildren(child._id);
            }
            await File.deleteOne({ _id: child._id });
        }
    };

    if (file.isFolder) {
      await deleteChildren(file._id);
    }

    if (file.parentId) {
      await File.findByIdAndUpdate(file.parentId, {
        $pull: { children: file._id }
      })
    }
    
    await File.deleteOne({ _id: fileId })

    let newActiveFileId = null;
    if (file.isActive) {
      const openFiles = await File.find({ userId, isFolder: false, isOpen: true, _id: { $ne: fileId } }).sort({updatedAt: -1});
      let nextActiveFile = openFiles[0];
      
      if (!nextActiveFile) {
        nextActiveFile = await File.findOne({ userId, isFolder: false, _id: { $ne: fileId } }).sort({updatedAt: -1});
      }

      if (nextActiveFile) {
        await File.findByIdAndUpdate(nextActiveFile._id, {
          isActive: true,
          isOpen: true
        });
        newActiveFileId = nextActiveFile._id.toString();
      }
    }

    return NextResponse.json({ success: true, newActiveFileId })
  } catch (error) {
    console.error("Failed to delete file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" }, 
      { status: 500 }
    )
  }
}
