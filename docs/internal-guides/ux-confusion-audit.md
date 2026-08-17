# Internal Audit: UX Confusion (The Truth)

## 1. Why do Pages and Entries both exist?
**The Confusion**: Even we (the founders) found ourselves asking: "Wait, should I make this a Page or a Content Type called 'Page'?"
**The Reality**: Currently, "Pages" are just a special Content Type that we hardcoded. This is confusing because it implies "Pages" are special, but they are just block-based entries.
**Honest Take**: We should probably merge them and just have "Block-based" vs "Field-based" entry modes.

## 2. Why is schema setup harder than expected?
**The Confusion**: Dragging fields into a builder feels like "Work". Users want to "Write".
**The Reality**: The product forces you to be a "Database Architect" before you can be an "Author".
**Honest Take**: We should let users "Write first, structure later". A "Freeform" mode that extracts fields automatically would be the killer feature.

## 3. Why is the publishing flow not obvious?
**The Confusion**: We kept forgetting to publish. 
**The Reality**: "Save" and "Publish" are two separate concepts in our heads, but for a solo developer, they are the same thing.
**Honest Take**: We are over-engineering for "Enterprise Workflows" when our current users just want to see their text on a screen.

## 4. Why is onboarding unclear?
**The Confusion**: We built the onboarding to look pretty, not to teach.
**The Reality**: The "Blueprint" selection feels like a final choice, when it's actually just a starter.
**Honest Take**: The onboarding should end with the user making a real API call. Currently, it ends with a "Success" screen and no clear next step.

## 5. Why is "Environment" management hidden?
**The Confusion**: We have "Development" and "Production" in the DB, but the UI barely mentions them.
**The Reality**: We are scared to confuse users with "Environments", so we hide them. But then users get confused why their API calls fail or return old data.
**Honest Take**: We should lean into it. Make the environment clear in the top bar at all times.

## 6. What feels "Broken" even if it works?
- **The Loader**: It's too fast. Sometimes you aren't sure if the page refreshed or if it just didn't do anything.
- **The Sidebar**: It takes up too much space on smaller screens.
- **The "Settings"**: They are scattered. Billing is one place, API Keys another, Team another. It should be one "Workspace Settings" hub.
