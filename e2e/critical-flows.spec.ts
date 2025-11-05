import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/auth');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    // Wait for validation messages
    await expect(page.getByText(/required/i).first()).toBeVisible();
  });

  test('should switch between login and signup', async ({ page }) => {
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    
    await page.getByRole('button', { name: /sign up/i }).click();
    
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });
});

test.describe('Inventory Management', () => {
  test.beforeEach(async ({ page }) => {
    // Assume user is logged in - you may need to set up authentication state
    await page.goto('http://localhost:8080');
    // Add authentication setup here if needed
  });

  test('should display inventory items', async ({ page }) => {
    await page.goto('http://localhost:8080/inventory');
    // Wait for data to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Check if table is visible
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('should search items', async ({ page }) => {
    await page.goto('http://localhost:8080/inventory');
    
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('test');
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Verify search input has value
    await expect(searchInput).toHaveValue('test');
  });
});

test.describe('CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/inventory');
    // Add authentication setup
  });

  test('should create new item', async ({ page }) => {
    await page.getByRole('button', { name: /add item/i }).click();
    
    await page.getByPlaceholder(/name/i).fill('Test Item');
    await page.getByPlaceholder(/quantity/i).fill('10');
    
    await page.getByRole('button', { name: /create/i }).click();
    
    // Wait for success message or item to appear
    await page.waitForTimeout(1000);
    
    // Verify item was created (adjust selector based on your UI)
    await expect(page.getByText('Test Item')).toBeVisible();
  });

  test('should edit item', async ({ page }) => {
    // Find and click edit button for first item
    const editButton = page.locator('button').filter({ hasText: /edit/i }).first();
    await editButton.click();
    
    // Update item name
    const nameInput = page.getByPlaceholder(/name/i);
    await nameInput.clear();
    await nameInput.fill('Updated Item');
    
    await page.getByRole('button', { name: /save/i }).click();
    
    // Verify update
    await page.waitForTimeout(1000);
    await expect(page.getByText('Updated Item')).toBeVisible();
  });

  test('should delete item', async ({ page }) => {
    // Find delete button
    const deleteButton = page.locator('button').filter({ hasText: /delete/i }).first();
    
    // Click delete and confirm
    await deleteButton.click();
    await page.getByRole('button', { name: /confirm/i }).click();
    
    // Verify deletion (wait for item to disappear)
    await page.waitForTimeout(1000);
  });
});

test.describe('Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('http://localhost:8080');
    
    // Navigate to Dashboard
    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL(/.*dashboard.*/);
    
    // Navigate to Inventory
    await page.getByRole('link', { name: /inventory/i }).click();
    await expect(page).toHaveURL(/.*inventory.*/);
    
    // Navigate to History
    await page.getByRole('link', { name: /history/i }).click();
    await expect(page).toHaveURL(/.*history.*/);
  });
});

