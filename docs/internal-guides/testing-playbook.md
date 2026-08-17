# Internal Guide: Testing Playbook

## 1. The "First-Time User" Smoke Test
**Goal**: Verify the core value loop works.

1. **Clean Slate**: Create a new account with a dummy email.
2. **Onboarding**: Complete workspace creation.
3. **Schema**: Create a "Test Type" with one text field.
4. **Entry**: Add one entry. Publish it.
5. **API**: Create an API key. 
6. **Fetch**: Run `curl -H "Authorization: Bearer <KEY>" <API_URL>/v1/entries/test-type`.
7. **Verify**: If JSON returns the entry, test PASSED.

## 2. The "Block Builder" Stress Test
**Goal**: Ensure complex layouts don't break the DB.

1. Create a new **Page**.
2. Add **10+ blocks** of different types.
3. Reorder them.
4. Save.
5. Refresh the page.
6. **Verify**: Are the blocks in the same order? (This is a frequent bug).

## 3. The "Media" Loop
1. Upload a 2MB JPEG.
2. Add it to an entry.
3. Delete the entry.
4. **Verify**: Does the image still exist in the media library? (It should).
5. Delete the image from the media library.
6. **Verify**: Check the URL. It should return a `404`.

## 4. The "Billing" Gate
1. Create a "Hobby" workspace.
2. Try to create 10 Content Types (Limit is 5).
3. **Verify**: Does it block you?
4. Upgrade to "Pro".
5. **Verify**: Can you now create the 6th Content Type?

## 5. What Should Be Simplified (Testing)
- **Automated E2E**: We need Playwright tests for the "Happy Path".
- **Seed Data**: A script to populate a workspace with 100 entries to test pagination.
- **API Sandbox**: An in-browser tool (like Swagger or Postman) inside the dashboard to test endpoints without leaving the site.
