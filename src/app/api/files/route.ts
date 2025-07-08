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

  const { name, isFolder, parentId, language } = await request.json()

  try {
    const newFile = new File({
      name,
      isFolder,
      parentId: parentId || null,
      userId: (session.user as any).id,
      language: isFolder ? undefined : (language || "plaintext"),
      isActive: !isFolder
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
          userId: (session.user as any).id,
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
      updates,
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

  try {
    const file = await File.findOne({ _id: fileId, userId: (session.user as any).id })
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

    if (file.isActive) {
      const anotherFile = await File.findOne({ userId: (session.user as any).id, isFolder: false });
      if (anotherFile) {
        await File.findByIdAndUpdate(anotherFile._id, {
          isActive: true
        });
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" }, 
      { status: 500 }
    )
  }
}
