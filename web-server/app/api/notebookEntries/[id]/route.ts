import { NextResponse } from 'next/server'
import db from '@/src'
import { Params } from 'next/dist/server/request/params'
import { isISO8601 } from 'validator'
import {
  notebookEntries,
  notebookEntryTagLinks,
  notebookTags,
} from '@/src/db/schema'
import { eq, inArray } from 'drizzle-orm'

export async function PUT(req: Request, props: { params: Params }) {
  const params = await props.params
  const id = params.id as string
  const data = await req.json()
  let { title, body, date, tags } = data

  if (!id) {
    return NextResponse.json(
      { error: 'Notebook entry ID is required' },
      { status: 400 }
    )
  }

  if (!title && !body && !date && !tags) {
    return NextResponse.json(
      {
        error: 'At least one field (title, body, date, tags) must be provided',
      },
      { status: 400 }
    )
  }

  if (date && !isISO8601(date)) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
  }

  if (body && body.length > 3000) {
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

  if (tags && !Array.isArray(tags)) {
    return NextResponse.json(
      { error: 'Tags must be an array of tags' },
      { status: 400 }
    )
  }

  if (tags && tags.length > 10) {
    return NextResponse.json(
      { error: 'Maximum of 10 tags allowed' },
      { status: 400 }
    )
  }

  if (tags) {
    tags = Array.from(new Set(tags))
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [upadatedEntry] = await tx
        .update(notebookEntries)
        .set({
          ...(title && { title }),
          ...(body && { body }),
          ...(date && { date }),
          updatedAt: new Date(),
        })
        .where(eq(notebookEntries.id, id))
        .returning()

      const tagIds: string[] = []

      if (tags) {
        for (const tag of tags) {
          const existingTag = await tx.query.notebookTags.findFirst({
            where: (notebookTags, { eq, and }) =>
              and(
                eq(notebookTags.name, tag),
                eq(notebookTags.userId, upadatedEntry.user_id)
              ),
          })

          if (!existingTag) {
            const [newTag] = await tx
              .insert(notebookTags)
              .values({ name: tag, userId: upadatedEntry.user_id })
              .returning()
            tagIds.push(newTag.id)
          } else {
            tagIds.push(existingTag.id)
          }
        }

        await tx
          .delete(notebookEntryTagLinks)
          .where(eq(notebookEntryTagLinks.entryId, id))

        await tx.insert(notebookEntryTagLinks).values(
          tagIds.map((tagId) => ({
            entryId: id,
            tagId,
          }))
        )
      }

      return upadatedEntry.id
    })

    return NextResponse.json(
      {
        message: 'Notebook entry updated successfully',
        id: result,
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

export async function DELETE(req: Request, props: { params: Params }) {
  const params = await props.params
  const id = params.id as string

  if (!id) {
    return NextResponse.json(
      { error: 'Notebook entry ID is required' },
      { status: 400 }
    )
  }

  try {
    const toBeDeletedTagLinks = await db
      .select()
      .from(notebookEntryTagLinks)
      .where(eq(notebookEntryTagLinks.entryId, id))

    const tagIds = toBeDeletedTagLinks.map((link) => link.tagId)

    const [deletedEntry] = await db
      .delete(notebookEntries)
      .where(eq(notebookEntries.id, id))
      .returning()

    if (!deletedEntry) {
      return NextResponse.json(
        { error: 'Notebook entry not found' },
        { status: 404 }
      )
    }

    const unusedTagIds = []

    for (const tagId of tagIds) {
      const entries = await db
        .select()
        .from(notebookEntryTagLinks)
        .where(eq(notebookEntryTagLinks.tagId, tagId))

      if (entries.length === 0) {
        unusedTagIds.push(tagId)
      }
    }

    if (unusedTagIds.length > 0) {
      await db
        .delete(notebookTags)
        .where(inArray(notebookTags.id, unusedTagIds))
    }

    return NextResponse.json(
      {
        message: 'Notebook entry deleted successfully',
        entryId: deletedEntry.id,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request, props: { params: Params }) {
  const params = await props.params
  const id = params.id as string

  if (!id) {
    return NextResponse.json(
      { error: 'Notebook entry ID is required' },
      { status: 400 }
    )
  }

  try {
    const notebookEntry = await db.query.notebookEntries.findFirst({
      where: (notebookEntries, { eq }) => eq(notebookEntries.id, id),
      with: {
        notebookEntryTagLinks: {
          with: {
            notebookTag: true,
          },
        },
      },
    })

    if (!notebookEntry) {
      return NextResponse.json(
        { error: 'Notebook entry not found' },
        { status: 404 }
      )
    }

    const tags = notebookEntry?.notebookEntryTagLinks.map(
      (link) => link.notebookTag
    )

    return NextResponse.json({ ...notebookEntry, tags }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
