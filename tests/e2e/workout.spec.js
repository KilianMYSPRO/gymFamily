import { test, expect } from '@playwright/test';

test('complete workout flow', async ({ page }) => {
    // 1. Initial Load (Land on Landing Page due to no auth)
    await page.goto('/');

    // 2. Register User (since DB is empty in CI)
    // Toggle to Register view
    await page.getByRole('button', { name: /Sign up|Inscrivez-vous/i }).click();

    const timestamp = Date.now();
    await page.getByPlaceholder(/Username|Nom d'utilisateur/i).fill(`testuser${timestamp}`);
    await page.getByPlaceholder(/Password|Mot de passe/i).first().fill('password123');
    // Security Question answer
    await page.getByPlaceholder(/Answer|Réponse/i).fill('Fido');

    await page.getByRole('button', { name: /Create Account|Créer un compte/i }).click();

    // 3. Verify Dashboard & Navigate to Planner
    await expect(page.getByText(/Let's Crush It/i)).toBeVisible({ timeout: 15000 });

    // Navigate to Planner to create a routine
    await page.getByRole('button', { name: /Planner|Planificateur/i }).click();

    // Click "New Plan" (or "Create" on mobile)
    await page.getByRole('button', { name: /New Plan|Create|Nouveau Plan|Créer/i }).first().click();

    // 4. Create Routine
    await page.getByPlaceholder(/e.g. PUSH DAY/i).fill('Full Body Blast');

    // Add Exercise
    await page.getByRole('button', { name: /Add Exercise|Ajouter un Exercice/i }).click();
    // Search and select an exercise (assuming Bench Press exists in default data)
    await page.getByPlaceholder(/Search|Rechercher/i).fill('Bench Press');
    await page.getByText('Barbell Bench Press - Medium Grip').first().click();

    // Save Routine
    await page.getByRole('button', { name: /Save Routine|Enregistrer/i }).first().click();

    // 5. Start Workout
    // Navigate to Workout tab (Tracker)
    await page.getByRole('button', { name: /Workout|Entraînement/i }).click();

    // Select the routine we just created
    // Use getByRole for better reliability with the new button layout
    await page.getByRole('button', { name: /Full Body Blast/i }).click();

    // 6. Verify Workout Started - "Finish" button should be visible
    // Wait for state sync
    await page.waitForTimeout(1000);
    
    // Using a more flexible locator since translation keys might show up in some CI environments
    await expect(page.getByRole('button', { name: /Finish|Terminer|tracker\.finish/i })).toBeVisible({ timeout: 15000 });

    // 7. Verify Timer (optional sanity check)
    // The timer format is mono font, let's just wait for visibility of the clock container
    await expect(page.locator('header').getByText(/:/)).toBeVisible();
});
