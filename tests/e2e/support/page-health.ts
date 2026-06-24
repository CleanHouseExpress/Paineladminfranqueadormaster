import { expect, Page } from '@playwright/test';

const technicalErrorPattern = /undefined|Cannot read|TypeError|ReferenceError|Internal Server Error|Erro 500|HTTP 500/i;
const blockedStatePattern = /Sem permiss|Algo deu errado|P[aá]gina n[aã]o encontrada/i;

export async function assertHealthyPage(
  page: Page,
  label = page.url(),
  options: { allowBlockedState?: boolean } = {},
) {
  await expect(page.locator('body'), `${label} deve renderizar o body`).toBeVisible();
  const text = await page.locator('body').innerText();

  expect(text.trim().length, `${label} nao deve ficar em branco`).toBeGreaterThan(0);
  expect(text, `${label} nao deve mostrar erro tecnico`).not.toMatch(technicalErrorPattern);

  if (!options.allowBlockedState) {
    expect(text, `${label} nao deve cair em estado bloqueado`).not.toMatch(blockedStatePattern);
  }
}

export async function openHealthy(
  page: Page,
  path: string,
  options: { allowBlockedState?: boolean } = {},
) {
  await page.goto(path);
  await assertHealthyPage(page, path, options);
}

