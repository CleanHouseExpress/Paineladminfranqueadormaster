import { expect, test, type Page } from '@playwright/test';
import { disableOnboarding } from './support/auth';

const forbiddenGateCopy = [
  'Communication Inbox esta disponivel',
  'Communication Inbox está disponível',
  'Este modulo esta disponivel para ativacao',
  'Este módulo está disponível para ativação',
];

const channelsPayload = {
  data: [
    {
      id: 'channel-zapi-1',
      name: 'WhatsApp Principal',
      provider: 'z_api',
      phone_number: '+55 11 99999-0000',
      status: 'connected',
      department: 'Atendimento',
      default_assignee: 'Marina',
      instance_id: 'instance-1',
      last_connected_at: '2026-06-25T12:30:00.000Z',
      last_disconnected_at: null,
      last_status_check_at: '2026-06-25T12:45:00.000Z',
      created_at: '2026-06-25T12:00:00.000Z',
      updated_at: '2026-06-25T12:45:00.000Z',
    },
  ],
};

const provisionedChannelPayload = {
  data: {
    channel_id: 'channel-provisioned-1',
    status: 'qr_pending',
    qr_code: 'QR seguro de teste',
    connection_status: 'qr_pending',
    channel: {
      id: 'channel-provisioned-1',
      name: 'WhatsApp Atendimento',
      provider: 'z_api',
      expected_phone_number: '5531999999999',
      phone_number: '5531999999999',
      status: 'qr_pending',
      department: 'Atendimento',
      default_assignee: 'Marina',
      provisioned_by_system: true,
      provisioned_at: '2026-06-30T12:00:00.000Z',
      created_at: '2026-06-30T12:00:00.000Z',
      updated_at: '2026-06-30T12:00:00.000Z',
    },
  },
};

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

async function mockAuthWithCommunicationAlias(page: Page) {
  await disableOnboarding(page);
  await page.addInitScript(() => {
    window.localStorage.setItem('orchestra_auth_token', 'e2e-token');
    window.localStorage.removeItem('communication-inbox-channels-v1');
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
        { module_id: 'communication', name: 'Communication Inbox', status: 'active' },
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

    if (path.endsWith('/conversations/conversation-1/messages/status')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
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

async function mockCommunicationChannels(page: Page) {
  await page.route('**/api/tenant/communication/channels?**', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(channelsPayload),
  }));

  await page.route('**/api/tenant/communication/channels/provision-whatsapp', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(provisionedChannelPayload),
  }));

  await page.route('**/api/tenant/communication/channels/channel-provisioned-1/refresh-qr', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(provisionedChannelPayload),
  }));

  await page.route('**/api/tenant/communication/channels/channel-provisioned-1/connection-status', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(provisionedChannelPayload),
  }));

  await page.route('**/api/tenant/communication/channels/*/logs', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: [] }),
  }));
}

async function expectModuleGateNotVisible(page: Page) {
  for (const text of forbiddenGateCopy) {
    await expect(page.getByText(text, { exact: false })).toHaveCount(0);
  }
}

test.describe('@smoke @communication Communication gate and aliases', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthWithCommunicationAlias(page);
    await mockCommunicationInbox(page);
    await mockCommunicationChannels(page);
  });

  test('/communication/inbox abre com modulo vindo como communication', async ({ page }) => {
    await page.goto('/communication/inbox');

    await expect(page.getByTestId('communication-inbox-page')).toBeVisible();
    await expect(page.getByTestId('communication-conversation-list')).toContainText('Ana Cliente');
    await expectModuleGateNotVisible(page);
  });

  test('/support abre como alias da caixa de entrada', async ({ page }) => {
    await page.goto('/support');

    await expect(page.getByTestId('communication-inbox-page')).toBeVisible();
    await expect(page.getByTestId('communication-conversation-list')).toContainText('Ana Cliente');
    await expectModuleGateNotVisible(page);
  });

  test('/communication/settings/channels nao cai no ModuleGate e renderiza acoes principais', async ({ page }) => {
    await page.goto('/communication/settings/channels');

    await expect(page.getByTestId('communication-settings-channels-page')).toBeVisible();
    await expect(page.getByText('WhatsApp Principal')).toBeVisible();
    await expect(page.getByTestId('communication-channel-create')).toBeVisible();
    await expect(page.getByTestId('communication-channel-create')).toContainText('Conectar WhatsApp');
    await expect(page.getByTestId('communication-channel-refresh')).toBeVisible();
    await expect(page.getByTestId('communication-channel-connect-channel-zapi-1')).toBeVisible();
    await expect(page.getByTestId('communication-channel-sync-channel-zapi-1')).toBeVisible();
    await expect(page.getByTestId('communication-channel-disconnect-channel-zapi-1')).toBeVisible();
    await expect(page.getByText('Provedor')).toHaveCount(0);
    await expect(page.getByText('Instance ID')).toHaveCount(0);
    await expect(page.getByText('Instance Token')).toHaveCount(0);
    await expect(page.getByText('Client Token')).toHaveCount(0);
    await expect(page.getByText('Z-API')).toHaveCount(0);
    await expect(page.getByTestId('communication-channel-logs-channel-zapi-1')).toHaveCount(0);
    await expectModuleGateNotVisible(page);
  });

  test('/communication/settings/channels provisiona WhatsApp sem campos tecnicos', async ({ page }) => {
    let provisionPayload: Record<string, unknown> | null = null;
    await page.route('**/api/tenant/communication/channels/provision-whatsapp', route => {
      provisionPayload = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(provisionedChannelPayload),
      });
    });

    await page.goto('/communication/settings/channels');
    await page.getByTestId('communication-channel-create').click();

    await expect(page.getByRole('heading', { name: 'Conectar WhatsApp' })).toBeVisible();
    await expect(page.getByText('Instance ID')).toHaveCount(0);
    await expect(page.getByText('Instance Token')).toHaveCount(0);
    await expect(page.getByText('Client Token')).toHaveCount(0);
    await expect(page.getByText('Provider')).toHaveCount(0);
    await expect(page.getByText('Z-API')).toHaveCount(0);

    await page.getByPlaceholder('Ex.: WhatsApp Atendimento').fill('WhatsApp Atendimento');
    await page.getByPlaceholder('5531999999999').fill('5531999999999');
    await page.getByRole('textbox', { name: 'Departamento padrao (opcional)' }).fill('Atendimento');
    await page.getByRole('textbox', { name: 'Atendente padrao (opcional)' }).fill('Marina');
    await page.getByRole('button', { name: 'Conectar WhatsApp' }).last().click();

    await expect(page.getByText('QR seguro de teste')).toBeVisible();
    expect(provisionPayload).toEqual({
      name: 'WhatsApp Atendimento',
      expected_phone_number: '5531999999999',
      default_department_id: null,
      default_assignee_id: null,
    });
    expect(provisionPayload).not.toHaveProperty('provider_instance_id');
    expect(provisionPayload).not.toHaveProperty('provider_instance_token');
    expect(provisionPayload).not.toHaveProperty('provider_client_token');
  });
});
