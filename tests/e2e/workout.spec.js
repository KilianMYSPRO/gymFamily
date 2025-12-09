import { test, expect } from '@playwright/test';

test('complete workout flow', async ({ page }) => {
    // 1. Initial Load
    await page.goto('/');
    await expect(page).toHaveTitle(/DuoGym/);

    // 2. Start Workout
    // Assuming there's a button with text "Start Workout" or similar logic
    const startButton = page.getByRole('button', { name: /Start Workout/i });
    if (await startButton.isVisible()) {
        await startButton.click();
    } else {
        // If we are already in a workout or needing to create one from the planner
        // Navigate to Planner tab if needed, or click the main FAB
        // Let's assume the main action button 'Plus' or similar starts it
        await page.getByRole('button', { name: /New Workout/i }).first().click();
    }

    // 3. Add Exercise
    await page.getByRole('button', { name: /Add Exercise/i }).click();
    await page.getByPlaceholder(/Search exercises/i).fill('Bench Press');
    await page.getByText('Bench Press (Barbell)').first().click();

    // 4. Log Set
    const weightInput = page.getByPlaceholder('kg').first();
    const repsInput = page.getByPlaceholder('reps').first();

    await weightInput.fill('100');
    await repsInput.fill('5');

    // Click checkmark or save to log the set
    // Assuming regex for a complete/check button or using a specific class if known
    // Using a generic locator for the 'complete set' action if accurate ID isn't known
    // Creating a robust locator based on common UI patterns
    await page.locator('button.bg-emerald-500').first().click(); // Complete set button usually green

    // 5. Check if set is logged (optional robust check)
    await expect(page.getByText('100 kg x 5')).toBeVisible();

    // 6. Finish Workout
    await page.getByRole('button', { name: /Finish/i }).click();

    // Confirm finish in modal if exists
    const confirmFinish = page.getByRole('button', { name: /Finish Workout/i });
    if (await confirmFinish.isVisible()) {
        await confirmFinish.click();
    }

    // 7. Verify History (Navigates to history or shows summary)
    await expect(page.getByText(/Workout Complete/i)).toBeVisible();
});
