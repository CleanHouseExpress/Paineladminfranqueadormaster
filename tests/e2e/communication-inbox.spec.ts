import { expect, test, type Page } from '@playwright/test';
import { disableOnboarding } from './support/auth';

const summaryPayload = {
  data: {
    total: 2,
    open: 1,
    waiting_handoff: 1,
    assigned: 1,
    unassigned: 1,
    closed: 0,
  },
};

const conversationsPayload = {
  data: [
    {
      id: 'c-1',
      customer_name: 'Ana Cliente',
      customer_phone: '+55 11 99999-0000',
      channel: 'whatsapp',
      status: 'open',
      handoff_status: 'requested',
      assignment_status: 'assigned',
      assigned_to_name: 'Marina',
      last_message: 'Preciso remarcar meu horario',
      last_message_at: '2026-06-25T12:30:00.000Z',
      unread_count: 2,
    },
    {
      id: 'c-2',
      customer_name: 'Bruno Cliente',
      channel: 'instagram',
      status: 'open',
      assignment_status: 'unassigned',
      last_message: 'Ola',
      last_message_at: '2026-06-25T11:00:00.000Z',
      unread_count: 0,
    },
  ],
  meta: {
    current_page: 1,
    last_page: 1,
    per_page: 25,
    total: 2,
  },
};

const messagesPayload = {
  data: [
    {
      id: 'm-1',
      conversation_id: 'c-1',
      direction: 'inbound',
      sender_type: 'client',
      sender_name: 'Ana Cliente',
      body: 'Preciso remarcar meu horario',
      created_at: '2026-06-25T12:30:00.000Z',
    },
    {
      id: 'm-2',
      conversation_id: 'c-1',
      direction: 'outbound',
      sender_type: 'bot',
      sender_name: 'IA',
      body: 'Claro, vou verificar as opcoes.',
      created_at: '2026-06-25T12:31:00.000Z',
    },
  ],
  meta: {
    current_page: 1,
    last_page: 1,
    per_page: 50,
    total: 2,
  },
};

async function mockAuth(page: Page) {
  await disableOnboarding(page);
  await page.addInitScript(() => {
    window.localStorage.setItem('orchestra_auth_token', 'e2e-token');
  });

  await page.route('**/api/me', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { id: 1, name: 'Admin Master', email: 'admin@orchestra.test' } }),
  }));
  await page.route('**/api/me/company', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { id: 1, name: 'Orchestra E2E', plan: 'enterprise' } }),
  }));
  await page.route('**/api/me/modules/sidebar', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      data: [
        { module_id: 'communication-inbox', name: 'Communication Inbox', status: 'active' },
        { module_id: 'dashboard', name: 'Dashboard', status: 'active' },
      ],
    }),
  }));
  await page.route('**/api/me/roles', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: [{ id: 1, name: 'master' }] }),
  }));
  await page.route('**/api/me/permissions', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: [] }),
  }));
}

async function mockInbox(page: Page, options: { empty?: boolean; error?: boolean } = {}) {
  await page.route('**/api/tenant/communication/inbox/summary**', route => route.fulfill({
    status: options.error ? 500 : 200,
    contentType: 'application/json',
    body: JSON.stringify(options.error ? { message: 'summary unavailable' } : summaryPayload),
  }));
  await page.route('**/api/tenant/communication/inbox/conversations/c-1/messages**', route => route.fulfill({
    status: options.error ? 500 : 200,
    contentType: 'application/json',
    body: JSON.stringify(options.error ? { message: 'messages unavailable' } : messagesPayload),
  }));
  await page.route('**/api/tenant/communication/inbox/conversations/c-1', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: conversationsPayload.data[0] }),
  }));
  await page.route('**/api/tenant/communication/inbox/conversations**', route => route.fulfill({
    status: options.error ? 500 : 200,
    contentType: 'application/json',
    body: JSON.stringify(
      options.error
        ? { message: 'conversations unavailable' }
        : options.empty
          ? { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } }
          : conversationsPayload,
    ),
  }));
}

test.describe('@smoke @communication Communication Inbox', () => {
  test('renderiza a pagina, carrega resumo, lista conversas e mensagens', async ({ page }) => {
    await mockAuth(page);
    await mockInbox(page);

    await page.goto('/communication/inbox');

    await expect(page.getByTestId('communication-inbox-page')).toBeVisible();
    await expect(page.getByTestId('communication-inbox-summary')).toContainText('Total');
    await expect(page.getByText('2').first()).toBeVisible();
    await expect(page.getByText('Ana Cliente')).toBeVisible();
    await expect(page.getByText('Bruno Cliente')).toBeVisible();
    await expect(page.getByText('Preciso remarcar meu horario').first()).toBeVisible();
    await expect(page.getByText('Claro, vou verificar as opcoes.')).toBeVisible();
  });

  test('seleciona conversa e lista mensagens da conversa selecionada', async ({ page }) => {
    await mockAuth(page);
    await mockInbox(page);

    await page.goto('/communication/inbox');
    await page.getByText('Ana Cliente').click();

    await expect(page.getByTestId('communication-message-list')).toContainText('Preciso remarcar meu horario');
    await expect(page.getByTestId('communication-message-list')).toContainText('Claro, vou verificar as opcoes.');
  });

  test('exibe estado vazio quando nao ha conversas', async ({ page }) => {
    await mockAuth(page);
    await mockInbox(page, { empty: true });

    await page.goto('/communication/inbox');

    await expect(page.getByTestId('communication-conversations-empty')).toBeVisible();
    await expect(page.getByTestId('communication-messages-empty')).toBeVisible();
  });

  test('exibe erro seguro quando a API falha', async ({ page }) => {
    await mockAuth(page);
    await mockInbox(page, { error: true });

    await page.goto('/communication/inbox');

    await expect(page.getByText('Nao foi possivel carregar esta area.').first()).toBeVisible();
    await expect(page.getByText('Tentar novamente').first()).toBeVisible();
  });
});
