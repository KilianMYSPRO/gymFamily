import { test, expect } from '@playwright/test';

test('complete workout flow', async ({ page }) => {
    // 1. Initial Load (Land on Landing Page due to no auth)
    await page.goto('/');

    // 2. Register User (since DB is empty in CI)
    // Toggle to Register view
    await page.getByRole('button', { name: /Sign up|Inscrivez-vous/i }).click();

    await page.getByPlaceholder(/Username|Nom d'utilisateur/i).fill('testuser');
    await page.getByPlaceholder(/Password|Mot de passe/i).first().fill('password123');
    // Security Question answer
    await page.getByPlaceholder(/Answer|Réponse/i).fill('Fido');

    await page.getByRole('button', { name: /Create Account|Créer un compte/i }).click();

    // 3. Verify Dashboard & Navigate to Planner
    await expect(page.getByText(/Let's Crush It/i)).toBeVisible();

    // Navigate to Planner to create a routine
    await page.getByRole('button', { name: /Planner|Planificateur/i }).click();

    // Click "New Plan" (or "Create" on mobile)
    await page.getByRole('button', { name: /New Plan|Create|Nouveau Plan|Créer/i }).first().click();

    // 4. Create Routine
    await page.getByPlaceholder(/e.g. Push Day/i).fill('Full Body Blast');

    // Add Exercise
    await page.getByRole('button', { name: /Add Exercise|Ajouter un Exercice/i }).click();
    // Search and select an exercise (assuming Bench Press exists in default data)
    await page.getByPlaceholder(/Search|Rechercher/i).fill('Bench Press');
    await page.getByText('Bench Press (Barbell)').first().click();

    // Save Routine
    await page.getByRole('button', { name: /Save Routine|Enregistrer/i }).first().click();

    // 5. Start Workout
    // Navigate to Workout tab (Tracker)
    await page.getByRole('button', { name: /Workout|Entraînement/i }).click();

    // Select the routine we just created
    await page.getByText('Full Body Blast').click();

    // 6. Verify Workout Started - "Finish" button should be visible
    await expect(page.getByRole('button', { name: /Finish|Terminer/i })).toBeVisible();

    // 7. Verify Timer (optional sanity check)
    await expect(page.getByText(/0:00/)).toBeVisible();
});
