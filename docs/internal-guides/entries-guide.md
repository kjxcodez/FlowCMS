# Internal Guide: Entries & Content Management

## 1. What This Feature Is Supposed To Do

Entries are the **actual data** inside your Content Types.
- **Why it exists**: Once you have a "Blog Post" structure, you need to write the actual posts.
- **When to use it**: Every time you want to add, edit, or delete a specific piece of content.
- **Goal**: To provide a clean, "Writer-Friendly" interface that abstracts away the database.

## 2. Exact Real Workflow

1. **Select Type**: Navigate to the specific Content Type (e.g., "Blog Posts").
2. **Create Entry**: Click "New Entry".
3. **Data Entry**: Fill in the fields defined in the schema.
4. **Drafting**: Save frequently. Status remains "Draft".
5. **Review**: Check for typos.
## Reality Check: Entry Limitations
- **Actually implemented now**: Text, number, date, and boolean editing. **AI Assist** for text fields.
- **Partially implemented**: **Media Picker**. You can see the UI, but it doesn't link to the media library correctly yet.
- **Planned but missing**: **Autosave**. Rich Text formatting (currently just a plain textarea).

## 3. Step-by-Step Operator Instructions

1. Go to **Dashboard -> Content Types**.
2. Find the card for **"Blog Post"**.
3. Click the bright **"View Entries"** button.
4. Click **"New Entry"**.
5. Fill in the Title, Content, and select an Image from the Media library.
6. Click **"Save"**.
7. Look at the top right toggle. It says **"Draft"**. 
8. Click it to switch to **"Published"**.
9. Your content is now live.

## 4. Real Example Content: Blog Post

**Data**:
- *Title*: "10 Reasons to use FlowCMS for your Next.js project"
- *Slug*: `10-reasons-flowcms`
- *Author*: "Jane Doe"
- *Content*: "Headless CMSs are taking over... [Long Rich Text Content]"
- *Category*: "Tutorial"

## 5. Founder Confusion Audit

- **The "Version" Mystery**: We have a `version` field in the DB but no way to see history in the UI. We found ourselves looking for "Undo" but it doesn't exist yet.
- **Bulk Actions**: We tried to publish 5 entries at once. You can't. You have to open each one. This is a massive friction point for real users.
- **Search vs Filter**: Searching for an entry only searches titles. If we need to find something by "Author", the search fails us.

## 6. UX Friction Notes

- **Autosave**: There is no autosave. If the browser crashes or the user navigates away, the content is gone. This is the #1 "Abandonment" trigger.
- **Rich Text Editor**: The editor is basic. It lacks things like "Embed YouTube" or "Upload Image Inline" (you have to use the media field).
- **Status Toggle**: The toggle at the top right is a bit hidden. Users look for a "Publish" button at the bottom of the form.

## 7. What Should Be Simplified

- **The "Save & Publish" Button**: Combine these into one primary action with a dropdown for "Save as Draft".
- **Inline Media Upload**: Allow users to drag images directly into the text area.
- **Global Search**: A search bar at the top of the dashboard that finds entries across *all* content types.
- **Bulk Publishing**: A checkbox system in the entry list to publish/delete multiple items.
