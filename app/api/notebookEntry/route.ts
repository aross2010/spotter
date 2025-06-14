import db from '@/src'
import {
  notebookEntries,
  notebookEntryTagLinks,
  notebookTags,
} from '@/src/db/schema'
import { NextResponse } from 'next/server'
import { isISO8601 } from 'validator'

export async function POST(req: Request) {
  const data = await req.json()
  if (!data)
    return NextResponse.json({ error: 'No data provided' }, { status: 400 })

  const { title, body, date, tags, userId } = data
  if (!body || !date || !userId) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  // limit body to 3,000 characters
  if (body.length > 3000) {
    return NextResponse.json(
      { error: 'Body exceeds maximum length of 3000 characters' },
      { status: 400 }
    )
  }

  if (title && title.length > 100) {
    return NextResponse.json(
      { error: 'Title exceeds maximum length of 100 characters' },
      { status: 400 }
    )
  }

  if (!Array.isArray(tags)) {
    return NextResponse.json(
      { error: 'Tags must be an array of tags' },
      { status: 400 }
    )
  }

  if (tags.length > 10) {
    return NextResponse.json(
      { error: 'Maximum of 10 tags allowed' },
      { status: 400 }
    )
  }

  if (!isISO8601(date)) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
  }

  try {
    await db.transaction(async (tx) => {
      const [notebookEntry] = await tx
        .insert(notebookEntries)
        .values({
          title,
          body,
          date,
          user_id: userId,
        })
        .returning()

      const tagIds: string[] = []

      for (const tag of tags) {
        const existingTag = await tx.query.notebookTags.findFirst({
          where: (notebookTags, { eq, and }) =>
            and(eq(notebookTags.name, tag), eq(notebookTags.userId, userId)),
        })

        if (!existingTag) {
          const [newTag] = await tx
            .insert(notebookTags)
            .values({
              name: tag,
              userId,
            })
            .returning()
          tagIds.push(newTag.id)
        } else {
          tagIds.push(existingTag.id)
        }
      }

      await tx.insert(notebookEntryTagLinks).values(
        tagIds.map((tagId) => ({
          entryId: notebookEntry.id,
          tagId,
        }))
      )
    })
    return NextResponse.json(
      {
        id: data.id,
        title: title || null,
        body,
        date,
        tags,
        userId,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error(error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
