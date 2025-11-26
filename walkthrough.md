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

## Verification Results

### Manual Verification
- **Valid JSON**: Importing a valid JSON structure works as expected.
- **Invalid JSON Syntax**: Pasting invalid JSON (e.g., missing quotes) and clicking "Import" or "Format JSON" shows a syntax error.
- **Invalid Schema**: Importing JSON with missing required fields (like `name`) shows a specific validation error.
- **UUID Generation**: Verified that the new UUID generator works correctly in the environment.
