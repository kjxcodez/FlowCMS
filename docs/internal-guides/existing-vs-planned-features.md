# Internal Audit: Existing vs. Planned Features

This is the most important file in this audit. It separates **implemented reality** from **aspirational fiction**.

## 1. The Core Infrastructure

### Actually implemented now:
- **Workspace/Auth**: Full user lifecycle, registration, and invitation system.
- **REST API v1**: Functional endpoints for `entries`, `pages`, and `media`.
- **Environment Isolation**: The DB structure supports it; the UI supports listing.
- **AI Assist**: Real integration with AI to generate SEO titles and content descriptions.

### Partially implemented:
- **Media Library**: You can upload and list files, but the "Picker" inside the entry editor is a UI placeholder.
- **Reference Fields**: The field type exists in the database, but the UI for selecting other entries is a dummy dropdown.
- **Onboarding**: It creates a workspace and schema, but leaves the user with an empty dashboard (no sample entries or keys).

### Planned but missing:
- **Webhooks**: Code exists for delivery, but the dashboard UI for managing them is incomplete.
- **Audit Logs**: The table is there, but the dashboard page is a mix of mock and real data.
- **Environments Creation**: Locked behind a "Pro" wall, but even for Pro, the "Promotion Flow" is just a "Coming Soon" label.

---

## 2. The Editors (Content Types & Entries)

### Actually implemented now:
- **Schema Builder**: Adding/Removing fields works. Editing slugs works.
- **Field Form**: Renders text, richtext, number, boolean, and date correctly.
- **Publishing Toggle**: Updates the `EntryStatus` correctly in the DB.

### Partially implemented:
- **Reference Selector**: Shows the field, but can't actually link to real entries yet.
- **Rich Text Editor**: A basic `textarea`. It lacks formatting (Bold, Italic, Links) or inline image support.

### Planned but missing:
- **Drag & Drop for Fields**: You cannot reorder fields once added. You have to delete and recreate.
- **Repeater / Group Fields**: Currently, you can only have flat field lists.
- **JSON Fields**: No UI for raw JSON editing in the form.

---

## 3. The Page Builder (Block Editor)

### Actually implemented now:
- **Drag & Drop**: Fully functional using `@dnd-kit`.
- **Block Types**: 9 real blocks (Heading, Text, Image, CTA, Divider, Quote, Code, Callout, Accordion).
- **Page Templates**: A browser that allows picking a "blueprint" to start with.

### Planned but missing:
- **Global Blocks**: No way to reuse a block across pages.
- **Live Preview**: The "Preview" button is a UI placeholder that doesn't show a rendered site.
- **Real-time Collaboration**: Mentioned in early docs; zero implementation.

---

## 4. Brutal Verdict
We are currently 60% of the way to a "Headless CMS" and 20% of the way to a "Product." The engine is running, but the steering wheel is missing handles. 

**Immediate Priority**:
1. Fix the **Media Picker** in the entry form.
2. Fix the **Reference Field** (this is the "headless" killer feature).
3. Add **Sample Entries** to onboarding so the dashboard isn't empty.
