# Internal Guide: Pages & Block Builder

## 1. What This Feature Is Supposed To Do

Pages are **one-off site layouts**.
- **Why it exists**: Sometimes content doesn't fit into a "list". You need a "Home" page with a hero, some features, and a pricing table. 
- **When to use it**: Landing pages, "About" pages, "Contact" pages.
- **Why it matters**: It gives marketing teams the power to build unique layouts without asking developers for new "schemas".

## 2. Pages vs Entries: The Deciding Factor

| Feature | Entries | Pages |
|---------|---------|-------|
| **Structure** | Schema-First (Rigid) | Layout-First (Flexible) |
| **Quantity** | High (Hundreds/Thousands) | Low (Tens) |
| **Use Case** | Blog, Product, Team | Home, Landing, Docs |
| **Building Block** | Fields | Blocks |

**User Confusion Rule**: If you are making a list of things, use **Entries**. If you are making a specific URL on your site, use **Pages**.

## 3. Exact Real Workflow

1. **New Page**: Dashboard -> Pages -> New Page.
2. **Setup**: Give it a Title ("Home") and Slug ("home").
3. **Canvas**: Start with a "Blank Canvas".
## Reality Check: The Block Canvas
- **Actually implemented now**: **Drag and Drop** block reordering. 9 block types.
- **Partially implemented**: Block customization. Some blocks have more settings than others.
- **Planned but missing**: **Global Blocks**. **Live Preview** (the button is currently a placeholder).

## 4. Step-by-Step Operator Instructions

1. Go to **Dashboard -> Pages**.
2. Click **"Create New Page"**.
3. Title: "Summer Sale Landing".
4. Click the **"Blocks"** tab.
5. Drag a **"Hero"** block to the top.
6. Edit the heading to "50% Off Everything".
7. Drag a **"Pricing"** block below it.
8. Click **"Save Page"**.
9. Visit the API link provided on the card to see the JSON representation of these blocks.

## 5. Real Example Content: Pricing Page

**Blocks**:
1. **Hero**: "Simple, Transparent Pricing"
2. **Pricing Grid**:
   - Plan 1: "Hobby" ($0)
   - Plan 2: "Pro" ($19)
3. **FAQ**: "Can I cancel anytime?"
4. **CTA**: "Get Started Now"

## 6. Founder Confusion Audit

- **"Where do I edit the text?"**: We found that clicking a block doesn't always open the editor sidebar immediately. It feels unresponsive.
- **Block Reuse**: We wanted to use a block from one page on another. You can't. You have to rebuild it. This is frustrating.
- **API Shape**: The JSON returned for Pages is an array of objects with `type` and `data`. Developers have to write a "Block Renderer" on the frontend, which is more work than a standard flat Entry.

## 7. UX Friction Notes

- **Preview**: The "Preview" button doesn't actually show a live site (unless you've configured a preview URL). It just shows a skeleton. This is misleading.
- **Reordering**: Dragging blocks to reorder them is difficult to trigger.
- **Required Fields**: There's no way to mark a block field as "Required". A user can save a Hero block without a title, which breaks the frontend.

## 8. What Should Be Simplified

- **Global Blocks**: Allow saving a "Footer" or "CTA" as a global block that updates everywhere.
- **Direct Text Editing**: Stop using sidebars for everything. Let users click the text on the canvas and type directly.
- **Pre-Built Layouts**: Provide 5 full-page blueprints (SaaS Home, Ecommerce Product, Blog Hub) so users just "swap text".
