import { test, expect } from '@playwright/test';

test('boots with no credentials, filters the table, and clears input safely', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.element-cell')).toHaveCount(118);
  await page.getByLabel('Search elements').fill('gold');
  await expect(page.locator('.element-cell:not(.dimmed)')).toHaveCount(1);
  await page.getByRole('button', { name: 'Gold, Au, atomic number 79', exact: true }).click();
  await expect(page.getByLabel('Gold mass in grams')).toBeVisible();
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Run simulation' })).toBeDisabled();
  await expect(page.getByText('Your next discovery starts here')).toBeVisible();
  expect(errors).toEqual([]);
});

test('loads a recipe, conserves mass, exports, and invalidates stale results', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Load a recipe' }).click();
  await page
    .locator('.recipe-card')
    .filter({ hasText: 'Water vapor formation' })
    .getByRole('button', { name: 'Load experiment' })
    .click();
  await expect(page.getByRole('spinbutton', { name: 'Temperature', exact: true })).toHaveValue(
    '773.15',
  );
  await page.getByRole('button', { name: 'Run simulation' }).click();
  await expect(page.getByText('Reaction complete', { exact: true })).toBeVisible();
  await expect(page.locator('.product-row')).toContainText('1.8015');
  await expect(page.locator('.result-metrics')).toContainText('-24.18');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('quantum-lab-experiment.json');
  await page.getByRole('spinbutton', { name: 'Temperature', exact: true }).fill('298.15');
  await page.getByRole('spinbutton', { name: 'Temperature', exact: true }).press('Tab');
  await expect(page.getByText('A little chemistry is all it takes.')).toBeVisible();
  await page.getByRole('button', { name: 'Run simulation' }).click();
  await expect(page.getByText('Activation conditions not met', { exact: true })).toBeVisible();
});

test('numeric fields handle invalid values, units, Escape, and viewport controls', async ({
  page,
}) => {
  await page.goto('/');
  const input = page.getByRole('spinbutton', { name: 'Temperature', exact: true });
  await input.fill('-5');
  await input.press('Tab');
  await expect(input).toHaveValue('298.15');
  await input.fill('800');
  await input.press('Escape');
  await expect(input).toHaveValue('298.15');
  await page.getByLabel('Temperature unit').selectOption('C');
  await expect(input).toHaveValue('25');
  await page.getByLabel('Pause animation', { exact: true }).click();
  await expect(page.getByText('PAUSED', { exact: true })).toBeVisible();
  await page.getByLabel('Molecular display style').selectOption('space-fill');
  await page.getByLabel('Zoom in', { exact: true }).click();
  await page.getByLabel('Expand viewport', { exact: true }).click();
  await expect(page.locator('.visualization-panel')).toHaveClass(/expanded/);
  await page.keyboard.press('Escape');
  await expect(page.locator('.visualization-panel')).not.toHaveClass(/expanded/);
});

test('preserves experiment across navigation and notes across reload, opens accessible guide', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Lab notes' }).click();
  await page
    .getByRole('textbox', { name: 'Lab notes', exact: true })
    .fill('Observe the limiting reactant.');
  await page.getByRole('button', { name: 'Learning center', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Build your chemistry intuition.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Laboratory', exact: true }).click();
  await expect(page.getByLabel('Hydrogen mass in grams')).toHaveValue('0.2016');
  await page.reload();
  await page.getByRole('tab', { name: 'Lab notes' }).click();
  await expect(page.getByRole('textbox', { name: 'Lab notes', exact: true })).toHaveValue(
    'Observe the limiting reactant.',
  );
  await page.getByRole('button', { name: 'Help & model guide' }).click();
  await expect(page.getByRole('dialog', { name: 'Model guide' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Model guide' })).not.toBeVisible();
});

test('renders working spectroscopy and pH tools without runtime errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Spectroscopy', exact: true }).click();
  await page.getByLabel('Molecule to analyze').selectOption({ label: 'Ethanol · C2H6O' });
  await expect(page.locator('.advanced-workspace canvas')).toBeVisible();
  await page.getByRole('button', { name: 'pH analysis', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'pH & Acid-Base Chemistry' })).toBeVisible();
  await page.getByLabel('Base added', { exact: true }).fill('100');
  await expect(page.getByText('12.52', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('mobile stays within viewport and navigation works', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('button', { name: 'Experiment recipes', exact: true }).click();
  await expect(page.locator('.recipe-card')).toHaveCount(7);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('learning guides are keyboard accessible and remember completion', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Learning center', exact: true }).click();
  const guide = page
    .locator('.advanced-workspace button')
    .filter({ hasText: 'Introduction to the Periodic Table' });
  // Guide titles originate from the bundled project reference data.
  const cards = page.locator('.advanced-workspace .group');
  if (await guide.count()) await guide.click();
  else await cards.first().click();
  while (await page.getByRole('button', { name: 'Next', exact: true }).count()) {
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Complete Tutorial' }).click();
  await expect(page.getByText('Completed', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Learning center', exact: true }).click();
  await expect(page.getByText('Completed', { exact: true })).toBeVisible();
});

test('tabs support arrow keys and reduced motion starts paused', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const firstTab = page.getByRole('tab', { name: 'Experiment', exact: true });
  await firstTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Results & analysis' })).toBeFocused();
  await expect(page.getByRole('tabpanel', { name: 'Results & analysis' })).toBeVisible();
  await expect(page.getByText('PAUSED', { exact: true })).toBeVisible();
});
