# Internal Audit: Should "Pages" Exist?

## 1. The Core Tension
FlowCMS currently has two parallel systems for content:
1. **Entries**: Rigid, schema-driven JSON data (stored in **Collections**).
2. **Pages**: Flexible, block-driven JSON layout.

From a user's perspective, both represent "content." The distinction is purely an architectural choice we made early on.

## 2. Is "Pages" a Design Illusion?
Right now, `Page` is a standalone Prisma model. But architectural truth suggests that a "Page" is simply an entry that uses a **Block System** instead of a **Field System**.

### Why they are different (Today):
- **Entries** require you to define a **Collection** (Schema) before you can type anything.
- **Pages** let you jump straight into a canvas and add blocks.

### Why they are the same (In Reality):
- Both are stored as JSON in the database.
- Both are delivered via a REST API.
- Both have slugs, titles, and publishing statuses.

## 3. The Merger Argument: Everything is an Entry
If we kill the "Pages" module and merge it into "Entries," what changes?

### The "Universal Entry" Model:
A **Collection** could have two modes:
1. **Structured Mode**: Standard fields (Title, Price, Date).
2. **Layout Mode**: A single `blocks` field that uses the Block Editor.

**Pros of Merging**:
- **One System to Explain**: "Everything in FlowCMS is an Entry."
- **Developer Simplicity**: One API endpoint for everything. No more `/v1/pages` vs `/v1/entries`.
- **Powerful Hybrids**: Imagine a "Blog Post" Collection that has structured metadata (Title, Author, Tags) but uses the **Block Editor** for the actual post content. This is currently impossible.

**Cons of Merging**:
- **Discovery**: Landing pages are often managed by different people than blog posts. Having them in separate buckets is a "perceived" organization benefit.

## 4. Brutal Recommendation: KILL PAGES
We should stop treating "Pages" as a separate system. It is a technical silo that creates massive UX friction.

**The Fix**:
- Deprecate the `Page` model.
- Add a `mode` field to **Collection** (`STRUCTURED` vs `VISUAL`).
- If `mode === VISUAL`, the entry editor becomes the **Block Editor**.
- If `mode === STRUCTURED`, it remains the **Field Form**.

**Result**: We solve the "Pages vs. Entries" confusion by deleting the confusion.
