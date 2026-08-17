# Internal Guide: How to Use FlowCMS

## 1. What This Product Is Supposed To Do

FlowCMS is a **Headless CMS** designed for speed and developer flexibility. 
- **Why it exists**: To decouple content from code. It allows non-technical authors to update content without a developer pushing code.
- **When to use it**: When you need a central repository for content that can be consumed by multiple platforms (Web, Mobile, etc.) via an API.
- **The Value**: It solves the "Edit Request" bottleneck. Developers build the structure once; content editors manage the data forever.

## 2. Exact Real Workflow (The "Happy Path")

1. **Model**: Define the shape of your data in **Content Types**.
2. **Author**: Create instances of that model in **Entries**.
3. **Publish**: Switch the entry from "Draft" to "Published".
4. **Fetch**: Use an **API Key** to request the JSON data.

## Reality Check: The Implementation Gap
- **Actually implemented now**: Schema creation, basic entry creation, and API delivery.
- **Partially implemented**: Media selection and cross-entry references.
- **Planned but missing**: Real-time frontend preview. Currently, you only see JSON.

## 3. Step-by-Step Operator Instructions

### Creating your first content workflow
1. **Login** to the FlowCMS Dashboard.
2. **Navigate to Content Types** in the sidebar.
3. **Click "Create New Type"**.
4. **Define the Schema**: Give it a name (e.g., `Product`) and a slug (`product`).
5. **Add Fields**: Drag and drop fields like "Short Text" for Name and "Number" for Price.
6. **Save Schema**: This creates the "Template".
7. **Navigate to Entries** (via the "View Entries" button on the Content Type card).
8. **Click "New Entry"**: Fill in the real data.
9. **Toggle to "Published"**: Click the status button.
10. **Fetch**: Go to **API Keys**, copy your token, and hit `GET /v1/entries/product`.

## 4. Real Example Content: SaaS Landing Page

**Structure**:
- **Hero Title**: Short Text
- **Hero Subtitle**: Long Text
- **CTA Text**: Short Text
- **Feature List**: (Repeater or JSON Block)
- **Pricing Plans**: (Connected Entries or JSON)

**Example Data**:
- *Title*: "Ship faster with FlowCMS"
- *Subtitle*: "The industrial-grade headless CMS for modern teams."
- *CTA*: "Start for Free"

## 5. Founder Confusion Audit

- **The "Environment" Trap**: We found ourselves creating content in "Production" but trying to fetch it without specifying the environment, or being confused why it doesn't show up in a different environment.
- **Slug Collisions**: It wasn't immediately obvious that slugs must be unique per workspace, not just per content type.
- **Draft vs Published**: Sometimes we'd save an entry and forget to publish, then spend 10 minutes wondering why the API returned an empty array.

## 6. UX Friction Notes

- **Labels**: "Content Types" is a technical term. First-time users often look for "Schemas" or "Tables".
- **Missing Feedback**: When saving a schema, the "Success" state is a bit too subtle. Users often click "Save" twice.
- **API URL Discovery**: Finding the exact endpoint URL to fetch a specific content type is buried. It should be on the Content Type detail page.
- **Empty States**: The dashboard feels "cold" for a new user. There's no "Create your first post" guidance.

## 7. What Should Be Simplified

- **Auto-Publishing**: Option to publish immediately upon creation for simple workflows.
- **Quick-Start Templates**: Instead of a blank canvas, offer "Blog", "Documentation", or "Portfolio" presets that create both the Content Type and a sample Entry.
- **In-Editor API Preview**: A small drawer that shows the exact JSON you'll get for the entry you're currently editing.
