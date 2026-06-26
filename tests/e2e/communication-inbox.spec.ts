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
      service_mode: 'human',
      handoff_status: 'none',
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

const timelinePayload = {
  data: [
    {
      id: 't-1',
      event_type: 'conversation_created',
      actor_type: 'system',
      actor_name: 'Orchestra',
      description: 'Conversa criada pelo canal WhatsApp.',
      metadata: { channel: 'whatsapp' },
      occurred_at: '2026-06-25T12:29:00.000Z',
    },
    {
      id: 't-2',
      event_type: 'handoff_requested',
      actor_type: 'agent',
      actor_name: 'IA',
      description: 'A IA solicitou atendimento humano.',
      metadata: { reason: 'intent_handoff' },
      occurred_at: '2026-06-25T12:31:00.000Z',
    },
    {
      id: 't-3',
      event_type: 'conversation_returned_to_ai',
      actor_type: 'human',
      actor_name: 'Admin Master',
      description: 'Conversa retornada para IA.',
      metadata: { reason: 'resolved' },
      occurred_at: '2026-06-25T12:33:00.000Z',
    },
  ],
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
  await page.route('**/api/me/units', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([]),
  }));
}

async function mockInbox(
  page: Page,
  options: {
    empty?: boolean;
    error?: boolean;
    closed?: boolean;
    failSend?: boolean;
    failReturnToAi?: boolean;
    emptyTimeline?: boolean;
    failTimeline?: boolean;
  } = {},
) {
  const calls = {
    summary: 0,
    conversations: 0,
    detail: 0,
    messages: 0,
    assign: 0,
    close: 0,
    reopen: 0,
    handoff: 0,
    sendMessage: 0,
    returnToAi: 0,
    timeline: 0,
    timelinePaths: [] as string[],
    timelineMethods: [] as string[],
    conversationQueries: [] as string[],
  };
  let currentConversation = {
    ...conversationsPayload.data[0],
    status: options.closed ? 'closed' : conversationsPayload.data[0].status,
  };
  let currentMessages = [...messagesPayload.data];

  await page.route('**/api/tenant/communication/inbox/**', route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path.endsWith('/summary')) {
      calls.summary += 1;
      return route.fulfill({
        status: options.error ? 500 : 200,
        contentType: 'application/json',
        body: JSON.stringify(options.error ? { message: 'summary unavailable' } : summaryPayload),
      });
    }

    if (path.endsWith('/conversations/c-1/request-handoff') && method === 'POST') {
      calls.handoff += 1;
      currentConversation = { ...currentConversation, handoff_status: 'requested' };
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: currentConversation }),
      });
    }

    if (path.endsWith('/conversations/c-1/assign') && method === 'POST') {
      calls.assign += 1;
      currentConversation = { ...currentConversation, assignment_status: 'assigned_to_me', assigned_to_name: 'Admin Master' };
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: currentConversation }),
      });
    }

    if (path.endsWith('/conversations/c-1/close') && method === 'POST') {
      calls.close += 1;
      currentConversation = { ...currentConversation, status: 'closed' };
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: currentConversation }),
      });
    }

    if (path.endsWith('/conversations/c-1/reopen') && method === 'POST') {
      calls.reopen += 1;
      currentConversation = { ...currentConversation, status: 'open', service_mode: 'human' };
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: currentConversation }),
      });
    }

    if (path.endsWith('/conversations/c-1/return-to-ai') && method === 'POST') {
      calls.returnToAi += 1;
      if (options.failReturnToAi) {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'return unavailable' }),
        });
      }

      currentConversation = {
        ...currentConversation,
        service_mode: 'ai',
        handoff_status: 'none',
        assignment_status: 'unassigned',
        assigned_to_name: null,
      };
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: currentConversation }),
      });
    }

    if (path.endsWith('/conversations/c-1/messages') && method === 'POST') {
      calls.sendMessage += 1;
      if (options.failSend) {
        return route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'send unavailable' }),
        });
      }

      const body = JSON.parse(request.postData() || '{}') as { text?: string };
      const nextMessage = {
        id: `m-${currentMessages.length + 1}`,
        conversation_id: 'c-1',
        direction: 'outbound',
        sender_type: 'human',
        sender_name: 'Admin Master',
        body: body.text ?? '',
        created_at: '2026-06-25T12:32:00.000Z',
      };
      currentMessages = [...currentMessages, nextMessage];
      currentConversation = {
        ...currentConversation,
        last_message: body.text ?? '',
        last_message_at: nextMessage.created_at,
      };

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: nextMessage }),
      });
    }

    if (path.endsWith('/conversations/c-1/messages')) {
      calls.messages += 1;
      return route.fulfill({
        status: options.error ? 500 : 200,
        contentType: 'application/json',
        body: JSON.stringify(
          options.error
            ? { message: 'messages unavailable' }
            : {
              ...messagesPayload,
              data: currentMessages,
              meta: { ...messagesPayload.meta, total: currentMessages.length },
            },
        ),
      });
    }

    if (path.endsWith('/conversations/c-1/timeline')) {
      calls.timeline += 1;
      calls.timelinePaths.push(path);
      calls.timelineMethods.push(method);
      return route.fulfill({
        status: options.failTimeline ? 404 : 200,
        contentType: 'application/json',
        body: JSON.stringify(
          options.failTimeline
            ? { message: 'timeline unavailable' }
            : options.emptyTimeline
              ? { data: [] }
              : timelinePayload,
        ),
      });
    }

    if (path.endsWith('/conversations/c-1')) {
      calls.detail += 1;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: currentConversation }),
      });
    }

    if (path.endsWith('/conversations')) {
      calls.conversations += 1;
      calls.conversationQueries.push(url.search);
      return route.fulfill({
        status: options.error ? 500 : 200,
        contentType: 'application/json',
        body: JSON.stringify(
          options.error
            ? { message: 'conversations unavailable' }
            : options.empty
              ? { data: [], meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 } }
              : {
                ...conversationsPayload,
                data: [currentConversation, conversationsPayload.data[1]],
                meta: {
                  ...conversationsPayload.meta,
                  current_page: Number(url.searchParams.get('page') ?? 1),
                  last_page: 2,
                  total: 50,
                },
              },
        ),
      });
    }

    return route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ message: `Unhandled inbox mock: ${method} ${path}` }),
    });
  });

  return calls;
}

test.describe('@smoke @communication Communication Inbox', () => {
  test('renderiza a pagina, carrega resumo, lista conversas e mensagens', async ({ page }) => {
    await mockAuth(page);
    await mockInbox(page);

    await page.goto('/communication/inbox');

    await expect(page.getByTestId('communication-inbox-page')).toBeVisible();
    await expect(page.getByTestId('communication-inbox-summary')).toContainText('Total');
    await expect(page.getByText('2').first()).toBeVisible();
    await expect(page.getByTestId('communication-conversation-list')).toContainText('Ana Cliente');
    await expect(page.getByTestId('communication-conversation-list')).toContainText('Bruno Cliente');
    await expect(page.getByText('Preciso remarcar meu horario').first()).toBeVisible();
    await expect(page.getByText('Claro, vou verificar as opcoes.')).toBeVisible();
  });

  test('exibe painel de detalhes da conversa selecionada', async ({ page }) => {
    await mockAuth(page);
    await mockInbox(page);

    await page.goto('/communication/inbox');

    await expect(page.getByTestId('communication-conversation-details')).toBeVisible();
    await expect(page.getByTestId('communication-conversation-details')).toContainText('Ana Cliente');
    await expect(page.getByTestId('communication-conversation-details')).toContainText('+55 11 99999-0000');
    await expect(page.getByTestId('communication-conversation-details')).toContainText('Responsavel');
    await expect(page.getByTestId('communication-conversation-details')).toContainText('Marina');
  });

  test('busca conversa usando parametro search da API nova', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page);

    await page.goto('/communication/inbox');
    await page.getByTestId('communication-filter-search').fill('Ana');

    await expect.poll(() => calls.conversationQueries.some(query => query.includes('search=Ana'))).toBeTruthy();
  });

  test('paginacao de conversas chama proxima pagina', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page);

    await page.goto('/communication/inbox');
    await expect(page.getByTestId('communication-conversation-pagination-label')).toContainText('Pagina 1 de 2');
    await page.getByTestId('communication-page-next').click();

    await expect.poll(() => calls.conversationQueries.some(query => query.includes('page=2'))).toBeTruthy();
  });

  test('aba Timeline aparece, chama endpoint e renderiza eventos', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page);

    await page.goto('/communication/inbox');

    await expect(page.getByTestId('communication-tab-timeline')).toBeVisible();
    expect(calls.timeline).toBe(0);

    await page.getByTestId('communication-tab-timeline').click();

    await expect.poll(() => calls.timeline).toBe(1);
    await expect(page.getByTestId('communication-timeline-panel')).toBeVisible();
    await expect(page.getByTestId('communication-timeline-list')).toContainText('Conversa criada');
    await expect(page.getByTestId('communication-timeline-list')).toContainText('Atendimento humano solicitado');
    await expect(page.getByTestId('communication-timeline-list')).toContainText('Retornado para IA');
    await expect(page.getByTestId('communication-timeline-list')).toContainText('Admin Master');
    expect(calls.timelinePaths).toEqual([
      '/api/tenant/communication/inbox/conversations/c-1/timeline',
    ]);
    expect(calls.timelineMethods).toEqual(['GET']);
  });

  test('timeline renderiza estado vazio', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page, { emptyTimeline: true });

    await page.goto('/communication/inbox');
    await page.getByTestId('communication-tab-timeline').click();

    await expect.poll(() => calls.timeline).toBe(1);
    await expect(page.getByTestId('communication-timeline-empty')).toBeVisible();
  });

  test('timeline renderiza erro seguro', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page, { failTimeline: true });

    await page.goto('/communication/inbox');
    await page.getByTestId('communication-tab-timeline').click();

    await expect.poll(() => calls.timeline).toBe(1);
    await expect(page.getByTestId('communication-timeline-error')).toBeVisible();
    await expect(page.getByText('Nao foi possivel carregar a timeline.')).toBeVisible();
  });

  test('renderiza botoes de acao', async ({ page }) => {
    await mockAuth(page);
    await mockInbox(page);

    await page.goto('/communication/inbox');

    await expect(page.getByTestId('communication-action-assign')).toBeVisible();
    await expect(page.getByTestId('communication-action-handoff')).toBeVisible();
    await expect(page.getByTestId('communication-action-return-ai')).toBeVisible();
    await expect(page.getByTestId('communication-action-close')).toBeVisible();
  });

  test('assign chama API e refaz chamadas principais', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page);

    await page.goto('/communication/inbox');
    await page.getByTestId('communication-action-assign').click();

    await expect.poll(() => calls.assign).toBe(1);
    await expect.poll(() => calls.summary).toBeGreaterThan(1);
    await expect.poll(() => calls.conversations).toBeGreaterThan(1);
    await expect(page.getByTestId('communication-conversation-details')).toContainText('Admin Master');
  });

  test('request handoff chama API e atualiza UI', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page);

    await page.goto('/communication/inbox');
    await page.getByTestId('communication-action-handoff').click();

    await expect.poll(() => calls.handoff).toBe(1);
    await expect.poll(() => calls.summary).toBeGreaterThan(1);
    await expect(page.getByTestId('communication-conversation-details')).toContainText('Aguardando humano');
  });

  test('mostra botao Voltar para IA em conversa humana', async ({ page }) => {
    await mockAuth(page);
    await mockInbox(page);

    await page.goto('/communication/inbox');

    await expect(page.getByTestId('communication-conversation-details')).toContainText('Humano');
    await expect(page.getByTestId('communication-action-return-ai')).toBeVisible();
  });

  test('voltar para IA chama API e atualiza UI', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page);
    page.on('dialog', dialog => dialog.accept());

    await page.goto('/communication/inbox');
    await page.getByTestId('communication-action-return-ai').click();

    await expect.poll(() => calls.returnToAi).toBe(1);
    await expect.poll(() => calls.messages).toBeGreaterThan(1);
    await expect.poll(() => calls.summary).toBeGreaterThan(1);
    await expect.poll(() => calls.conversations).toBeGreaterThan(1);
    await expect(page.getByTestId('communication-conversation-details')).toContainText('IA');
    await expect(page.getByTestId('communication-composer-ai')).toBeVisible();
    await expect(page.getByTestId('communication-message-input')).toBeDisabled();
  });

  test('erro ao voltar para IA exibe mensagem segura', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page, { failReturnToAi: true });
    page.on('dialog', dialog => dialog.accept());

    await page.goto('/communication/inbox');
    await page.getByTestId('communication-action-return-ai').click();

    await expect.poll(() => calls.returnToAi).toBe(1);
    await expect(page.getByTestId('communication-action-error')).toBeVisible();
    await expect(page.getByTestId('communication-action-return-ai')).toBeVisible();
  });

  test('close chama API e exibe reabrir', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page);
    page.on('dialog', dialog => dialog.accept());

    await page.goto('/communication/inbox');
    await page.getByTestId('communication-action-close').click();

    await expect.poll(() => calls.close).toBe(1);
    await expect(page.getByTestId('communication-action-reopen')).toBeVisible();
  });

  test('reopen chama API e volta a exibir fechar', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page, { closed: true });

    await page.goto('/communication/inbox');
    await page.getByTestId('communication-action-reopen').click();

    await expect.poll(() => calls.reopen).toBe(1);
    await expect(page.getByTestId('communication-action-close')).toBeVisible();
  });

  test('composer aparece em conversa aberta', async ({ page }) => {
    await mockAuth(page);
    await mockInbox(page);

    await page.goto('/communication/inbox');

    await expect(page.getByTestId('communication-composer')).toBeVisible();
    await expect(page.getByTestId('communication-message-input')).toBeEnabled();
    await expect(page.getByTestId('communication-send-button')).toBeDisabled();
  });

  test('digitar e enviar chama API, limpa input e atualiza mensagens', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page);

    await page.goto('/communication/inbox');
    await page.getByTestId('communication-message-input').fill('Mensagem do atendente');
    await page.getByTestId('communication-send-button').click();

    await expect.poll(() => calls.sendMessage).toBe(1);
    await expect.poll(() => calls.messages).toBeGreaterThan(1);
    await expect.poll(() => calls.summary).toBeGreaterThan(1);
    await expect.poll(() => calls.conversations).toBeGreaterThan(1);
    await expect(page.getByTestId('communication-message-input')).toHaveValue('');
    await expect(page.getByTestId('communication-message-list')).toContainText('Mensagem do atendente');
  });

  test('enter envia e shift enter preserva quebra de linha', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page);

    await page.goto('/communication/inbox');
    await page.getByTestId('communication-message-input').fill('Linha 1');
    await page.getByTestId('communication-message-input').press('Shift+Enter');
    await page.getByTestId('communication-message-input').type('Linha 2');
    await expect(page.getByTestId('communication-message-input')).toHaveValue('Linha 1\nLinha 2');
    await page.getByTestId('communication-message-input').press('Enter');

    await expect.poll(() => calls.sendMessage).toBe(1);
    await expect(page.getByTestId('communication-message-input')).toHaveValue('');
  });

  test('conversa fechada nao permite envio', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page, { closed: true });

    await page.goto('/communication/inbox');

    await expect(page.getByTestId('communication-composer-closed')).toBeVisible();
    await expect(page.getByTestId('communication-message-input')).toBeDisabled();
    await expect(page.getByTestId('communication-send-button')).toBeDisabled();
    expect(calls.sendMessage).toBe(0);
  });

  test('erro de envio exibe mensagem segura', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page, { failSend: true });

    await page.goto('/communication/inbox');
    await page.getByTestId('communication-message-input').fill('Mensagem com falha');
    await page.getByTestId('communication-send-button').click();

    await expect.poll(() => calls.sendMessage).toBe(1);
    await expect(page.getByTestId('communication-send-error')).toBeVisible();
    await expect(page.getByTestId('communication-message-input')).toHaveValue('Mensagem com falha');
  });

  test('seleciona conversa e lista mensagens da conversa selecionada', async ({ page }) => {
    await mockAuth(page);
    await mockInbox(page);

    await page.goto('/communication/inbox');
    await page.getByTestId('communication-conversation-list').getByText('Ana Cliente').click();

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
