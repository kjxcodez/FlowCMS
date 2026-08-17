# Internal Audit: Onboarding Flow

## 1. The "Zero-Knowledge" Test

If a user signs up today with zero knowledge of FlowCMS, here is what happens:

1. **Email/Social Signup**: Smooth.
2. **"Welcome to FlowCMS"**: A nice animation, but no context on what to do next.
3. **Workspace Creation**: Asks for a name. Simple.
4. **The Tutorial**: Asks you to "Select a blueprint". This is the first decision.
   - **Friction**: The user doesn't know what a "blueprint" is yet.
   - **Fear**: "If I pick the wrong one, can I change it later?"
5. **Dashboard Drop**: The user is dropped into the main dashboard.
   - **The Problem**: It's empty. Zero guidance on the next click.

## 2. Exact Real Workflow (Current)

## Reality Check: The Onboarding Theater
- **Actually implemented now**: Real workspace and schema creation in the database.
- **Partially implemented**: The "Blueprint" selection. It only supports two hardcoded options (Blog and a Default).
- **Planned but missing**: **Sample Entries**. The user is left with a schema but an empty dashboard. **Automated API Keys**.

## 3. First User Experience Audit (The "Time to Value")

- **Time to first schema**: 2 minutes.
- **Time to first entry**: 5 minutes.
- **Time to first API fetch**: 10 minutes (if they find the API Keys section).
- **The "Aha!" Moment**: When they see the JSON response in the browser. 
- **The "Ugh" Moment**: When they realize they have to set up an API Key and use Header Auth to see their own content.

## 4. Founder Confusion Audit

- **Waitlist Gating**: We were confused if the waitlist was active or not during our own testing.
- **Verification Email**: If it doesn't arrive, the user is stuck on a blank screen with no "Resend" button.
- **Default Environment**: We didn't know which environment was "Active" by default.

## 5. UX Friction Notes

- **The "Empty Dashboard" Syndrome**: When there are no Content Types, the dashboard is just a sidebar. It should be a checklist: "1. Create Schema, 2. Add Content, 3. Connect API".
- **Terminology**: We use "Schema", "Content Type", and "Blueprint" interchangeably in the onboarding. We need to pick one and stick to it.
- **Missing Success Path**: After creating a workspace, we should show a "Copy this cURL command to see your data" snippet immediately.

## 6. What Should Be Simplified

- **The "Skip" Option**: Let users skip the onboarding if they are returning users.
- **Interactive Tour**: A simple "Pulsing Dot" that says "Click here to add your first post".
- **Instant Preview**: Instead of just saving, show a "Live API View" side-by-side during the onboarding.
- **Auto-Generated API Key**: Create a "Development" key automatically so the user doesn't have to navigate to settings.
