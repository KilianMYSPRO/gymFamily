import { test, expect } from '@playwright/test';

test('verify import modal shows current json', async ({ page }) => {
    // 1. Initial Load & Auth
    await page.goto('/');
    await page.getByRole('button', { name: /Sign up|Inscrivez-vous/i }).click();

    const timestamp = Date.now();
    await page.getByPlaceholder(/Username|Nom d'utilisateur/i).fill(`verify${timestamp}`);
    await page.getByPlaceholder(/Password|Mot de passe/i).first().fill('password123');
    await page.getByPlaceholder(/Answer|Réponse/i).fill('Fido');
    await page.getByRole('button', { name: /Create Account|Créer un compte/i }).click();
    await expect(page.getByText(/Let's Crush It/i)).toBeVisible();

    // 2. Create Routine
    await page.getByRole('button', { name: /Planner|Planificateur/i }).click();
    await page.getByRole('button', { name: /New Plan|Create|Nouveau Plan|Créer/i }).first().click();
    await page.getByPlaceholder(/e.g. PUSH DAY/i).fill('View Source Test');

    // Add Exercise
    await page.getByRole('button', { name: /Add Exercise|Ajouter un Exercice/i }).click();
    await page.getByPlaceholder(/Search|Rechercher/i).fill('Deadlift');
    await page.getByText('Barbell Deadlift').first().click();

    // 3. Click Import Button (Download Icon) inside the editor
    // The button is now visible inside the creation form
    const importBtn = page.getByRole('button', { name: /Import|Importer/i });
    await expect(importBtn).toBeVisible();
    await importBtn.click();

    // Wait for modal
    // We can assert the textarea is visible
    await expect(page.locator('textarea')).toBeVisible();

    // 4. Verify Content
    // The textarea has a specific placeholder we can target, or use the class
    const jsonContent = await page.locator('textarea').inputValue();
    console.log('Import Modal Content:', jsonContent);

    const parsed = JSON.parse(jsonContent);
    expect(parsed.name).toBe('View Source Test');
    expect(parsed.exercises).toHaveLength(1);
    expect(parsed.exercises[0].name).toContain('Deadlift');
});
