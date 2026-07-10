import { expect, test, type Page } from '@playwright/test';
import { disableOnboarding } from './support/auth';

const forbiddenGateCopy = [
  'Communication Inbox esta disponivel',
  'Communication Inbox está disponível',
  'Este modulo esta disponivel para ativacao',
  'Este módulo está disponível para ativação',
];

const summaryPayload = {
  data: {
    total: 1,
    open: 1,
    waiting_handoff: 0,
    assigned: 1,
    unassigned: 0,
    closed: 0,
  },
};

const conversationsPayload = {
  data: [
    {
      id: 'conversation-1',
      customer_name: 'Ana Cliente',
      customer_phone: '+55 11 98888-0000',
      channel: 'whatsapp',
      status: 'open',
      service_mode: 'human',
      handoff_status: 'none',
      assignment_status: 'assigned',
      assigned_to_name: 'Marina',
      last_message: 'Preciso de ajuda',
      last_message_at: '2026-06-25T12:30:00.000Z',
      unread_count: 1,
    },
  ],
  meta: {
    current_page: 1,
    last_page: 1,
    per_page: 25,
    total: 1,
  },
};

const messagesPayload = {
  data: [
    {
      id: 'message-1',
      conversation_id: 'conversation-1',
      direction: 'inbound',
      sender_type: 'client',
      sender_name: 'Ana Cliente',
      body: 'Preciso de ajuda',
      created_at: '2026-06-25T12:30:00.000Z',
    },
  ],
  meta: {
    current_page: 1,
    last_page: 1,
    per_page: 50,
    total: 1,
  },
};

const inactiveSettingsPayload = {
  data: {
    module_active: false,
    module_status: 'inactive',
    state: 'module_inactive',
  },
};

const disconnectedSettingsPayload = {
  data: {
    module_active: true,
    module_status: 'active',
    state: 'qrcode_available',
    instance_name: 'orchestra-acme-whatsapp',
    qr_code: 'QR seguro de teste',
    connected_phone_number: null,
    last_updated_at: '2026-07-09T13:20:00.000Z',
  },
};

const connectedSettingsPayload = {
  data: {
    module_active: true,
    module_status: 'active',
    state: 'connected',
    instance_name: 'orchestra-acme-whatsapp',
    connected_phone_number: '+55 11 99999-0000',
    last_updated_at: '2026-07-09T13:25:00.000Z',
  },
};

async function mockAuthWithCommunicationAlias(page: Page) {
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

  await page.route('**/api/me/modules**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      data: [
        { module_id: 'communication', name: 'Communication Inbox', status: 'active' },
        { module_id: 'support', name: 'Atendimento', status: 'active' },
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

  await page.route('**/api/me/units', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([]),
  }));
}

async function mockCommunicationInbox(page: Page) {
  await page.route('**/api/tenant/communication/inbox/**', route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path.endsWith('/summary')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(summaryPayload),
      });
    }

    if (path.endsWith('/conversations/conversation-1/messages')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(messagesPayload),
      });
    }

    if (path.endsWith('/conversations/conversation-1')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: conversationsPayload.data[0] }),
      });
    }

    if (path.endsWith('/conversations')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(conversationsPayload),
      });
    }

    return route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ message: `Unhandled inbox mock: ${request.method()} ${path}` }),
    });
  });
}

async function expectModuleGateNotVisible(page: Page) {
  for (const text of forbiddenGateCopy) {
    await expect(page.getByText(text, { exact: false })).toHaveCount(0);
  }
}

async function mockCommunicationSettings(
  page: Page,
  options: {
    settings?: unknown;
    status?: unknown;
    refresh?: unknown;
    activate?: unknown;
    settingsStatus?: number;
  } = {},
) {
  let statusCalls = 0;
  let activateCalls = 0;
  let refreshCalls = 0;
  let directServiceCalls = 0;

  await page.route('**/api/internal/communication/**', route => {
    directServiceCalls += 1;
    return route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Browser must not call Communication Service directly.' }),
    });
  });

  await page.route('**/api/tenant/communication/settings', route => route.fulfill({
    status: options.settingsStatus ?? 200,
    contentType: 'application/json',
    body: JSON.stringify(options.settings ?? disconnectedSettingsPayload),
  }));

  await page.route('**/api/tenant/communication/activate', route => {
    activateCalls += 1;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(options.activate ?? disconnectedSettingsPayload),
    });
  });

  await page.route('**/api/tenant/communication/whatsapp/status', route => {
    statusCalls += 1;
    const body = Array.isArray(options.status)
      ? options.status[Math.min(statusCalls - 1, options.status.length - 1)]
      : options.status;

    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body ?? disconnectedSettingsPayload),
    });
  });

  await page.route('**/api/tenant/communication/whatsapp/qrcode/refresh', route => {
    refreshCalls += 1;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(options.refresh ?? disconnectedSettingsPayload),
    });
  });

  return {
    statusCalls: () => statusCalls,
    activateCalls: () => activateCalls,
    refreshCalls: () => refreshCalls,
    directServiceCalls: () => directServiceCalls,
  };
}

test.describe('@smoke @communication Communication gate and aliases', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthWithCommunicationAlias(page);
    await mockCommunicationInbox(page);
  });

  test('/communication/inbox abre com modulo vindo como communication', async ({ page }) => {
    await page.goto('/communication/inbox');

    await expect(page.getByTestId('communication-inbox-page')).toBeVisible();
    await expect(page.getByTestId('sidebar-communication-inbox')).toHaveCount(1);
    await expect(page.getByTestId('sidebar-support')).toHaveCount(0);
    await expect(page.getByTestId('sidebar-communication-inbox')).toContainText('Central de Conversas');
    await expect(page.getByTestId('communication-conversation-list')).toContainText('Ana Cliente');
    await expectModuleGateNotVisible(page);
  });

  test('/support abre como alias da caixa de entrada', async ({ page }) => {
    await page.goto('/support');

    await expect(page.getByTestId('communication-inbox-page')).toBeVisible();
    await expect(page.getByTestId('communication-conversation-list')).toContainText('Ana Cliente');
    await expectModuleGateNotVisible(page);
  });

  test('/communication/settings/channels mostra card de ativacao quando modulo esta inativo', async ({ page }) => {
    await mockCommunicationSettings(page, { settings: inactiveSettingsPayload });

    await page.goto('/communication/settings/channels');

    await expect(page.getByTestId('communication-settings-channels-page')).toBeVisible();
    await expect(page.getByText('Communication ainda nao esta ativo')).toBeVisible();
    await expect(page.getByTestId('communication-activate-button')).toContainText('Ativar modulo Communication');
    await expectModuleGateNotVisible(page);
  });

  test('/communication/settings/channels ativa modulo e recarrega status', async ({ page }) => {
    const calls = await mockCommunicationSettings(page, {
      settings: inactiveSettingsPayload,
      activate: disconnectedSettingsPayload,
      status: disconnectedSettingsPayload,
    });

    await page.goto('/communication/settings/channels');
    await page.getByTestId('communication-activate-button').click();

    await expect(page.getByText('orchestra-acme-whatsapp')).toBeVisible();
    await expect(page.getByTestId('communication-whatsapp-qrcode-panel')).toBeVisible();
    expect(calls.activateCalls()).toBe(1);
    expect(calls.statusCalls()).toBe(1);
    expect(calls.directServiceCalls()).toBe(0);
  });

  test('/communication/settings/channels status disconnected mostra QR Code', async ({ page }) => {
    const calls = await mockCommunicationSettings(page, { settings: disconnectedSettingsPayload });

    await page.goto('/communication/settings/channels');

    await expect(page.getByText('QR Code disponivel')).toBeVisible();
    await expect(page.getByTestId('communication-whatsapp-qrcode-panel')).toBeVisible();
    await expect(page.getByText('Abra o WhatsApp no celular, va em Aparelhos conectados e escaneie este QR Code.')).toBeVisible();
    await expect(page.getByTestId('communication-whatsapp-qrcode-text')).toContainText('QR seguro de teste');
    expect(calls.directServiceCalls()).toBe(0);
  });

  test('/communication/settings/channels status connected mostra badge e esconde QR Code', async ({ page }) => {
    await mockCommunicationSettings(page, { settings: connectedSettingsPayload });

    await page.goto('/communication/settings/channels');

    await expect(page.getByTestId('communication-connected-success')).toContainText('WhatsApp conectado');
    await expect(page.getByText('+55 11 99999-0000')).toBeVisible();
    await expect(page.getByTestId('communication-whatsapp-qrcode-panel')).toHaveCount(0);
  });

  test('/communication/settings/channels erro de API mostra alerta amigavel', async ({ page }) => {
    await mockCommunicationSettings(page, {
      settingsStatus: 500,
      settings: { message: 'Communication service is unavailable.' },
    });

    await page.goto('/communication/settings/channels');

    await expect(page.getByTestId('communication-settings-error')).toContainText('Communication service is unavailable.');
  });

  test('/communication/settings/channels botao atualizar status recarrega dados', async ({ page }) => {
    const calls = await mockCommunicationSettings(page, {
      settings: disconnectedSettingsPayload,
      status: connectedSettingsPayload,
    });

    await page.goto('/communication/settings/channels');
    await page.getByTestId('communication-refresh-status-button').click();

    await expect(page.getByTestId('communication-connected-success')).toContainText('WhatsApp conectado');
    await expect(page.getByTestId('communication-whatsapp-qrcode-panel')).toHaveCount(0);
    expect(calls.statusCalls()).toBe(1);
  });

  test('/communication/settings/channels botao gerar QR Code recarrega painel', async ({ page }) => {
    const calls = await mockCommunicationSettings(page, {
      settings: {
        data: {
          ...disconnectedSettingsPayload.data,
          qr_code: 'QR antigo',
        },
      },
      refresh: {
        data: {
          ...disconnectedSettingsPayload.data,
          qr_code: 'QR novo',
        },
      },
    });

    await page.goto('/communication/settings/channels');
    await page.getByTestId('communication-refresh-qrcode-action').click();

    await expect(page.getByTestId('communication-whatsapp-qrcode-text')).toContainText('QR novo');
    expect(calls.refreshCalls()).toBe(1);
  });
});
