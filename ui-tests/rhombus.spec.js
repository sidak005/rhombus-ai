import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, copyFileSync, unlinkSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.resolve(__dirname, '../files/messy.csv');

async function login(page) {
  await page.goto('https://rhombusai.com');
  await page.getByRole('button', { name: /log in/i }).click();
  await page.waitForURL(/.*auth.*/);
  await page.getByLabel(/email/i).fill(process.env.RHOMBUS_EMAIL);
  await page.locator('input#password').fill(process.env.RHOMBUS_PASSWORD);
  await page.locator('button[data-action-button-primary="true"]').click();
  await page.waitForURL('https://rhombusai.com/', { timeout: 15000 });
}

async function closeTutorial(page) {
  await page.waitForTimeout(2000);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);
  const overlay = page.locator('[class*="modal"], [class*="overlay"], [class*="tutorial"]').first();
  if (await overlay.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.mouse.click(10, 10);
    await page.waitForTimeout(1000);
  }
}

async function dropFile(page, locator, filePath) {
  const buffer = readFileSync(filePath);
  const fileName = path.basename(filePath);
  await locator.evaluate((dropzone, { buf, name }) => {
    const dt = new DataTransfer();
    dt.items.add(new File([new Uint8Array(buf)], name, { type: 'text/csv' }));
    const opts = { dataTransfer: dt, bubbles: true, cancelable: true };
    dropzone.dispatchEvent(new DragEvent('dragenter', opts));
    dropzone.dispatchEvent(new DragEvent('dragover', opts));
    dropzone.dispatchEvent(new DragEvent('drop', opts));
  }, { buf: Array.from(buffer), name: fileName });
}

test.describe('Rhombus AI', () => {
  test('Test 1: should sign in successfully', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL('https://rhombusai.com/');
  });

  test('Test 2: full workflow', async ({ page }) => {
    // sign in
    await login(page);

    // open existing project
    await page.getByText('test-project').click();
    await page.waitForTimeout(3000);

    // close the tutorial
    await closeTutorial(page);

    // upload CSV
    const tempFileName = `messy_${Date.now()}.csv`;
    const tempFilePath = path.resolve(__dirname, '../files', tempFileName);
    copyFileSync(CSV_PATH, tempFilePath);
    const chatInput = page.locator('[placeholder*="Attach or drop"]');

    try {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
      await chatInput.waitFor({ state: 'visible', timeout: 10000 });
      await dropFile(page, chatInput, tempFilePath);

      await expect(page.getByText(new RegExp(tempFileName.replace('.', '\\.'), 'i')))
        .toBeVisible({ timeout: 60000 });
    } finally {
      unlinkSync(tempFilePath);
    }

    // prompt and send
    const pipelineTaskCount = await page.getByText(/build tasks/i).count();

    // auto button -> button row -> chat container -> textbox
    const chatPanel = page.getByRole('button', { name: 'Auto' }).locator('../..');
    const textBox = chatPanel.getByRole('textbox');
    await textBox.waitFor({ state: 'visible', timeout: 10000 });
    await textBox.fill('Clean this dataset - fix email formatting, standardize country names to full names, fill missing ages with the average and convert all names to title case');

    // click the send button
    const sendButton = page.getByRole('button', { name: 'Auto' }).locator('..').locator('button').last();
    await sendButton.click();

    await expect(page.getByText(/build tasks/i)).toHaveCount(pipelineTaskCount + 1, { timeout: 90000 });
    await page.waitForTimeout(2000);

    // we click Run Pipeline and wait for execution
    await page.getByRole('button', { name: /run pipeline/i }).click();
    await expect(page.getByText(/pipeline execution completed/i)).toBeVisible({ timeout: 240000 });

    // last custom canvas node which is our output node
    const outputNodes = page.getByRole('button', { name: /^Custom \[OP_ROLE=.*transform\]/ });
    await outputNodes.last().waitFor({ state: 'visible', timeout: 10000 });
    await outputNodes.last().click();
    await page.waitForTimeout(2000);

    // preview tab
    const preview = page.getByRole('tab', { name: /preview/i });
    if (await preview.isVisible({ timeout: 5000 }).catch(() => false)) {
      await preview.click();
      await page.waitForTimeout(2000);
      await expect(page.locator('td:visible').first()).toBeVisible({ timeout: 15000 });
    }

    // download
    await page.getByRole('button', { name: /download/i }).click();
    const csvDownload = page.waitForEvent('download');
    await page.getByText('Download as CSV').click();
    const download = await csvDownload;

    console.log('Downloaded:', download.suggestedFilename());
    expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  });

});
