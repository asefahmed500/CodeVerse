import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { TerminalSession } from "@/models/TerminalSession"
import dbConnect from "@/lib/db"

export async function GET() {
  await dbConnect()
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const terminals = await TerminalSession.find({ userId: (session.user as any).id })
    return NextResponse.json(terminals)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch terminals" }, 
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

  const { title } = await request.json()

  try {
    await TerminalSession.updateMany(
      { userId: (session.user as any).id },
      { isActive: false }
    )

    const newTerminal = new TerminalSession({
      title: title || `Terminal ${(await TerminalSession.countDocuments({ userId: (session.user as any).id })) + 1}`,
      userId: (session.user as any).id,
      isActive: true
    })

    await newTerminal.save()
    return NextResponse.json(newTerminal)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create terminal" }, 
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

  const { terminalId, content, commands, currentCommandIndex, isActive } = await request.json()

  try {
    const updates: any = { updatedAt: new Date() }
    if (content !== undefined) updates.content = content
    if (commands !== undefined) updates.commands = commands
    if (currentCommandIndex !== undefined) updates.currentCommandIndex = currentCommandIndex
    if (isActive !== undefined) updates.isActive = isActive

    if (isActive) {
      await TerminalSession.updateMany(
        { 
          userId: (session.user as any).id,
          _id: { $ne: terminalId }
        },
        { isActive: false }
      )
    }

    const updatedTerminal = await TerminalSession.findOneAndUpdate(
      { _id: terminalId, userId: (session.user as any).id },
      updates,
      { new: true }
    )

    if (!updatedTerminal) {
      return NextResponse.json(
        { error: "Terminal not found" }, 
        { status: 404 }
      )
    }

    return NextResponse.json(updatedTerminal)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update terminal" }, 
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

  const { terminalId } = await request.json()

  try {
    await TerminalSession.deleteOne({ _id: terminalId, userId: (session.user as any).id })

    const remainingTerminals = await TerminalSession.find({
      userId: (session.user as any).id
    })
    if (remainingTerminals.length > 0) {
      const activeTerminal = remainingTerminals.find(t => t.isActive);
      if (!activeTerminal) {
        await TerminalSession.findByIdAndUpdate(remainingTerminals[0]._id, {
          isActive: true
        });
      }
    } else {
      const newTerminal = new TerminalSession({
        title: "Terminal 1",
        userId: (session.user as any).id,
        isActive: true
      })
      await newTerminal.save()
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete terminal" }, 
      { status: 500 }
    )
  }
}
