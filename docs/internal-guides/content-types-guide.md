# Internal Guide: Content Types & Schema Design

## 1. What This Feature Is Supposed To Do

Content Types are the **blueprints** of your data.
- **Why it exists**: Computers (and APIs) need structure. If you tell FlowCMS "I'm writing a Blog Post", it needs to know what fields a blog post contains so it can validate the data.
- **When to use it**: Every time you have a repeatable data structure.
- **Why not use Pages?**: Content Types are for **Structured Data** (lists of things like team members, products, posts). Pages are for **Layouts** (specific one-off pages like "About Us").

## 2. Exact Real Workflow

1. **Ideation**: Decide what fields you need.
2. **Schema Creation**: Dashboard -> Content Types -> New.
3. **Field Mapping**: Use the `FieldBuilder` to add:
   - `Title` (Short Text, Required)
   - `Body` (Rich Text)
   - `Author` (Reference or Short Text)
   - `Thumbnail` (Media)
4. **Validation**: Set which fields are required.
## Reality Check: Schema Restrictions
- **Actually implemented now**: Vertical field lists, field renaming, and slug editing.
- **Partially implemented**: Reference field type (UI exists, logic is missing).
- **Planned but missing**: **Drag and Drop** for reordering fields. Repeater fields for lists of objects.

## 3. Step-by-Step Operator Instructions

1. Go to **Dashboard -> Content Types**.
2. Click **"Create New Type"**.
3. Under **"Display Name"**, type "Team Member".
4. Notice the **"API Slug"** auto-fills to `team-member`. Keep it.
5. Click **"Add Field"**.
6. Select **"Short Text"**. Name it "Full Name". Toggle "Required".
7. Select **"Media"**. Name it "Avatar".
8. Select **"Long Text"**. Name it "Bio".
9. Click **"Save Schema"** at the top right.

## 4. Real Example Content: Product Catalog

**Fields Needed**:
- `name` (Short Text)
- `sku` (Short Text, Unique-intent)
- `price` (Number)
- `description` (Rich Text)
- `images` (Media List)
- `inStock` (Boolean)

**Example Data**:
- *Name*: "FlowStream Pro Controller"
- *SKU*: "FL-PRO-01"
- *Price*: 299
- *In Stock*: True

## 5. Founder Confusion Audit

- **Slug vs Name**: We often confused the Display Name with the API Slug. Changing the Name doesn't change the API endpoint, which is good for stability but confusing if you want them to match later.
- **Field Deletion**: Deleting a field from a schema effectively "hides" that data from the API for existing entries, but doesn't delete it from the DB. This was unclear.
- **Required Fields**: If you make a field "Required" *after* entries already exist, it can cause validation errors when trying to update those old entries.

## 6. UX Friction Notes

- **Field Sorting**: Reordering fields in the builder is a bit clunky. It should be a simple drag-handle.
- **Advanced Field Types**: Things like "JSON" or "Repeater" are powerful but have zero guidance. Users don't know what to put in them.
- **Slug Constraints**: There's no real-time validation if a slug is already taken until you hit "Save".

## 7. What Should Be Simplified

- **The "Blueprint" Gallery**: Provide a library of 10-15 standard schemas (Product, Event, Person, Review) so users don't have to build from scratch every time.
- **Field Grouping**: Ability to group fields into sections (e.g., "SEO Metadata", "Main Content").
- **Visual Preview**: A "Mock Entry" preview that shows how the data entry form will look as you build the schema.
