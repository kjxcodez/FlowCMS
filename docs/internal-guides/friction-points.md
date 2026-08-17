# Internal Audit: UX Friction Points

## 1. The "Dead-End" Dashboard
- **Location**: Home Page after login.
- **Issue**: It shows "Usage" and "Recent Activity". If you have zero usage, it's a graveyard.
- **Friction**: The user says "Now what?".
- **Fix**: Add a "Getting Started" stepper.

## 2. The "Hidden" Required Fields
- **Location**: Content Type Editor.
- **Issue**: You can create a schema, but if you don't add at least one field, you can't create an entry.
- **Friction**: The user creates a "Category" type, goes to add an entry, and sees an empty screen with a "Save" button. They don't realize they *must* go back and add fields.
- **Fix**: Warning if a Content Type has zero fields.

## 3. The "Unclear" Success State
- **Location**: All "Save" actions.
- **Issue**: Clicking "Save" shows a tiny toast or just stops the loading spinner.
- **Friction**: Users aren't sure if it's saved. They click it 3-4 times.
- **Fix**: Confetti? Or a clearer "Saved at 2:00 PM" label.

## 4. The "Slug" Anxiety
- **Location**: Creating Pages or Content Types.
- **Issue**: If I name my page "About", the slug becomes "about". If I change the title to "Our Story", the slug stays "about".
- **Friction**: Users get confused why the URL doesn't match the title.
- **Fix**: A "Sync Slug" button.

## 5. The "API Key" Barrier
- **Location**: Settings -> API Keys.
- **Issue**: To see content, you *need* a key. Keys are hidden in settings.
- **Friction**: First-time users try to hit the URL in the browser and get a `401 Unauthorized`. They assume the product is broken.
- **Fix**: Provide a "Public (Read-Only)" key by default for every new workspace.

## 6. The "Draft" Trap
- **Location**: Entry Editor.
- **Issue**: Content is "Draft" by default. 
- **Friction**: Users save content and it doesn't appear on their site. They don't notice the small toggle at the top.
- **Fix**: A big "Publish" button.

## 7. The "Media" Disconnect
- **Location**: Media Library.
- **Issue**: You can upload images, but you can't easily "Copy URL" to use them elsewhere.
- **Friction**: You have to go into an entry to actually "use" an image.
- **Fix**: Add a "Copy Public URL" button to every image in the gallery.
