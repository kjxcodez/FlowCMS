# Internal Guide: Real User Workflows

## 1. Scenario: Building a "Docs" Hub
**User Goal**: Create a structured documentation site.

**Workflow**:
1. **Create Content Type**: "Docs Page".
2. **Add Fields**:
   - `Section` (Select: Setup, API, Deployment)
   - `Title` (Short Text)
   - `Content` (Markdown/Rich Text)
   - `Order` (Number)
3. **Create Entries**: One for every doc page.
4. **Fetch**: Frontend requests `GET /v1/entries/docs-page?sort=order:asc`.

**Why this is good**: Centralized control. If you change a "Setup" step, it updates everywhere.

---

## 2. Scenario: SaaS Marketing Landing
**User Goal**: Quickly spin up a "Summer Sale" page.

**Workflow**:
1. **Create Page**: "Summer Sale".
2. **Slug**: `/sale`.
3. **Use Template**: Pick "High Conversion Landing".
4. **Customize**: Change the pricing from $99 to $49.
5. **Publish**: Toggle live.

**Why this is good**: Speed. No developer needed for the sale.

---

## 3. Scenario: Multi-Brand Product Feed
**User Goal**: Manage product data for two different websites from one CMS.

**Workflow**:
1. **Create Content Type**: "Product".
2. **Add Field**: `Brand` (Select: Brand A, Brand B).
3. **Fetch (Brand A)**: `GET /v1/entries/product?filter=brand:BrandA`.
4. **Fetch (Brand B)**: `GET /v1/entries/product?filter=brand:BrandB`.

**Why this is good**: One source of truth for inventory.

---

## 4. Scenario: Internal Company Handbook
**User Goal**: Private content for employees only.

**Workflow**:
1. **Create Content Type**: "Policy".
2. **Create API Key**: Scope it to `read:entries`.
3. **Secure**: Frontend checks employee login before using the key to fetch data.

---

## 5. What Should Be Simplified

- **The "Slug" Mental Model**: Users struggle with why `/docs` and `docs-page` are different. We should suggest common patterns.
- **Relational Content**: If a "Blog Post" needs an "Author", creating that relationship is currently 4-5 clicks deep. It should be possible to "Create New Author" from inside the Blog Post editor.
- **Image Optimization**: Users upload 5MB PNGs. We should auto-convert to WebP and provide different sizes via the API.
