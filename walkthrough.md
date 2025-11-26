# Import Feature Improvements

I have improved the JSON import feature in the Workout Planner to provide better feedback and validation.

## Changes

### 1. Improved Error Handling
- The app now catches specific JSON parsing errors and displays them to the user.
- Added validation for:
    - Missing `name` field.
    - Missing or invalid `exercises` array.
    - Empty `exercises` array.
    - Missing `name` in individual exercises.

### 2. "Format JSON" Button
- Added a "Format JSON" button to the import modal.
- This allows you to paste minified or messy JSON and format it for readability.
- If the JSON is invalid, clicking this button will show the specific syntax error.

### 3. Fixed UUID Generation Error
- Replaced `crypto.randomUUID()` with a robust utility function.
- This fixes the "crypto.randomUUID is not a function" error seen in some environments.

### 4. Mobile Layout Fix
- Adjusted the "Import Routine" modal buttons to stack vertically on mobile devices.
- This prevents the "Format JSON" button from overflowing the screen on small displays.

### 5. Optional Exercises
- You can now mark exercises as "Optional" in the Planner.
- In the Tracker, optional exercises have a distinct badge.
- A "Skip Optional Exercise" button allows you to quickly skip them during a workout.

### 6. Weight Tracking
- Added a "Log Entry" button in the Profile tab to track your body weight over time.
- Added a "Body Weight" chart in the Analytics tab to visualize your progress (loss or gain).
- **Recent History**: You can now see your last 5 weight entries in the Profile tab.
- **Delete Entries**: Added a delete button (trash icon) to remove incorrect weight entries.
- **Improved Feedback**: The "Changes saved successfully!" message is now more prominent.

## Verification Results

### Manual Verification
- **Valid JSON**: Importing a valid JSON structure works as expected.
- **Invalid JSON Syntax**: Pasting invalid JSON (e.g., missing quotes) and clicking "Import" or "Format JSON" shows a syntax error.
- **Invalid Schema**: Importing JSON with missing required fields (like `name`) shows a specific validation error.
- **UUID Generation**: Verified that the new UUID generator works correctly in the environment.
- **Mobile Layout**: Verified code changes to ensure buttons stack on mobile (`flex-col-reverse`) and align horizontally on desktop (`md:flex-row`).
- **Optional Exercises**: Verified that the "Optional" toggle works in the Planner and the badge/skip button appear in the Tracker.
- **Weight Tracking**: Verified that logging weight adds an entry to history and the chart renders correctly in Analytics.
- **Weight UX**: Verified that recent entries are listed, can be deleted, and the success message is clearly visible.
