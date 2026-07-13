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

const assigneesPayload = {
  data: [
    {
      id: 'u-1',
      name: 'Marina',
      email: 'marina@orchestra.test',
      role: 'Atendente',
    },
    {
      id: 'u-2',
      name: 'Carlos Atendimento',
      email: 'carlos@orchestra.test',
      role: 'Supervisor',
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
  await page.route('**/api/me/modules**', route => route.fulfill({
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

async function enableRealtimeTestProvider(page: Page) {
  await page.addInitScript(() => {
    (window as Window & { __ORCHESTRA_REALTIME_TEST__?: boolean }).__ORCHESTRA_REALTIME_TEST__ = true;
  });
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
    failAssignees?: boolean;
    failTransfer?: boolean;
    unorderedConversations?: boolean;
    messageStatus?: 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
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
    assignees: 0,
    transfer: 0,
    timeline: 0,
    timelinePaths: [] as string[],
    timelineMethods: [] as string[],
    conversationQueries: [] as string[],
    assigneeQueries: [] as string[],
  };
  let currentConversation = {
    ...conversationsPayload.data[0],
    status: options.closed ? 'closed' : conversationsPayload.data[0].status,
  };
  const secondConversation = {
    ...conversationsPayload.data[1],
    last_message_at: options.unorderedConversations
      ? '2026-06-25T13:05:00.000Z'
      : conversationsPayload.data[1].last_message_at,
  };
  let currentMessages = messagesPayload.data.map(message => message.id === 'm-2' ? {
    ...message,
    status: options.messageStatus ?? 'sent',
    sent_at: '2026-06-25T12:31:01.000Z',
    delivered_at: ['delivered', 'read'].includes(options.messageStatus ?? '') ? '2026-06-25T12:31:02.000Z' : null,
    read_at: options.messageStatus === 'read' ? '2026-06-25T12:31:03.000Z' : null,
    failed_at: options.messageStatus === 'failed' ? '2026-06-25T12:31:04.000Z' : null,
  } : message);
  const helpers = {
    pushInboundMessage(body = 'Mensagem nova em tempo real') {
      const nextMessage = {
        id: `m-${currentMessages.length + 1}`,
        conversation_id: 'c-1',
        direction: 'inbound',
        sender_type: 'client',
        sender_name: 'Ana Cliente',
        body,
        created_at: '2026-06-25T12:40:00.000Z',
      };
      currentMessages = [...currentMessages, nextMessage];
      currentConversation = {
        ...currentConversation,
        last_message: body,
        last_message_at: nextMessage.created_at,
      };
      return nextMessage;
    },
    setMessageStatus(status: 'sent' | 'delivered' | 'read' | 'failed' | 'pending') {
      currentMessages = currentMessages.map(message => message.id === 'm-2'
        ? {
          ...message,
          status,
          delivered_at: ['delivered', 'read'].includes(status) ? '2026-06-25T12:31:02.000Z' : null,
          read_at: status === 'read' ? '2026-06-25T12:31:03.000Z' : null,
          failed_at: status === 'failed' ? '2026-06-25T12:31:04.000Z' : null,
        }
        : message);
    },
  };

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

    if (path.endsWith('/assignees')) {
      calls.assignees += 1;
      calls.assigneeQueries.push(url.search);
      const search = String(url.searchParams.get('search') ?? '').toLowerCase();
      const data = search
        ? assigneesPayload.data.filter(assignee =>
          assignee.name.toLowerCase().includes(search) || assignee.email.toLowerCase().includes(search)
        )
        : assigneesPayload.data;
      return route.fulfill({
        status: options.failAssignees ? 500 : 200,
        contentType: 'application/json',
        body: JSON.stringify(options.failAssignees ? { message: 'assignees unavailable' } : { data }),
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

    if (path.endsWith('/conversations/c-1/transfer') && method === 'POST') {
      calls.transfer += 1;
      if (options.failTransfer) {
        return route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'transfer unavailable' }),
        });
      }

      const body = JSON.parse(request.postData() || '{}') as { assignee_id?: string };
      const assignee = assigneesPayload.data.find(item => item.id === body.assignee_id);
      currentConversation = {
        ...currentConversation,
        assignment_status: 'assigned',
        assigned_to_name: assignee?.name ?? 'Atendente transferido',
      };
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
        status: 'sent',
        sent_at: '2026-06-25T12:32:00.000Z',
        delivered_at: null,
        read_at: null,
        failed_at: null,
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

    if (path.endsWith('/conversations/c-2/messages')) {
      calls.messages += 1;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'm-c2-1',
              conversation_id: 'c-2',
              direction: 'inbound',
              sender_type: 'client',
              sender_name: 'Bruno Cliente',
              body: 'Ola',
              created_at: '2026-06-25T11:00:00.000Z',
            },
          ],
          meta: { current_page: 1, last_page: 1, per_page: 50, total: 1 },
        }),
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

    if (path.endsWith('/conversations/c-2')) {
      calls.detail += 1;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: secondConversation }),
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
                data: [currentConversation, secondConversation],
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

  return Object.assign(calls, helpers);
}

async function emitRealtimeEvent(page: Page, event: string, payload?: unknown) {
  await page.evaluate(({ event: eventName, payload: eventPayload }) => {
    (window as Window & {
      __ORCHESTRA_REALTIME_EMIT__?: (event: string, payload?: unknown) => void;
    }).__ORCHESTRA_REALTIME_EMIT__?.(eventName, eventPayload);
  }, { event, payload });
}

async function getRealtimeTestState(page: Page) {
  return page.evaluate(() => (window as Window & {
    __ORCHESTRA_REALTIME_TEST_STATE__?: {
      channels: string[];
      subscribed: string[];
      unsubscribed: string[];
      listened: string[];
      stopped: string[];
      connected: boolean;
    };
  }).__ORCHESTRA_REALTIME_TEST_STATE__);
}

async function openConversationMenu(page: Page) {
  await page.getByLabel('Abrir acoes da conversa').click();
}

async function openConversationDetails(page: Page) {
  await openConversationMenu(page);
  await page.getByTestId('communication-open-details').click();
}

test.describe('@smoke @communication Communication Inbox', () => {
  test('renderiza a pagina, carrega resumo, lista conversas e mensagens', async ({ page }) => {
    await mockAuth(page);
    await mockInbox(page);

    await page.goto('/communication/inbox');

    await expect(page.getByTestId('communication-inbox-page')).toBeVisible();
    await page.getByTestId('communication-inbox-summary').click();
    await expect(page.getByText('Total')).toBeVisible();
    await expect(page.getByText('2').first()).toBeVisible();
    await expect(page.getByTestId('communication-conversation-list')).toContainText('Ana Cliente');
    await expect(page.getByTestId('communication-conversation-list')).toContainText('Bruno Cliente');
    await expect(page.getByText('Preciso remarcar meu horario').first()).toBeVisible();
    await expect(page.getByText('Claro, vou verificar as opcoes.')).toBeVisible();
  });

  test('ordena conversas pela ultima mensagem mais recente', async ({ page }) => {
    await mockAuth(page);
    await mockInbox(page, { unorderedConversations: true });

    await page.goto('/communication/inbox');

    const conversationNames = page.getByTestId('communication-conversation-list').locator('p.font-semibold');
    await expect(conversationNames.first()).toContainText('Bruno Cliente');
  });

  test('realtime desligado nao quebra a tela', async ({ page }) => {
    await mockAuth(page);
    await mockInbox(page);

    await page.goto('/communication/inbox');

    await expect(page.getByTestId('communication-inbox-page')).toBeVisible();
    await expect(page.getByTestId('communication-realtime-status')).toContainText('Offline');
  });

  test('realtime ativo assina canais de tenant e conversa', async ({ page }) => {
    await enableRealtimeTestProvider(page);
    await mockAuth(page);
    await mockInbox(page);

    await page.goto('/communication/inbox');

    await expect(page.getByTestId('communication-realtime-status')).toContainText('Online');
    await expect.poll(async () => {
      const state = await getRealtimeTestState(page);
      return state?.channels.includes('tenant.1.communication') && state.channels.includes('conversation.c-1');
    }).toBeTruthy();
  });

  test('evento MessageReceived recarrega mensagens da conversa atual', async ({ page }) => {
    await enableRealtimeTestProvider(page);
    await mockAuth(page);
    const calls = await mockInbox(page);

    await page.goto('/communication/inbox');
    await expect(page.getByTestId('communication-message-list')).toContainText('Claro, vou verificar as opcoes.');

    const initialMessages = calls.messages;
    calls.pushInboundMessage('Nova mensagem por realtime');
    await emitRealtimeEvent(page, 'MessageReceived', { conversation_id: 'c-1' });

    await expect.poll(() => calls.messages).toBeGreaterThan(initialMessages);
    await expect(page.getByTestId('communication-message-list')).toContainText('Nova mensagem por realtime');
  });

  test('evento MessageStatusUpdated recarrega status das mensagens', async ({ page }) => {
    await enableRealtimeTestProvider(page);
    await mockAuth(page);
    const calls = await mockInbox(page, { messageStatus: 'sent' });

    await page.goto('/communication/inbox');
    await expect(page.getByTestId('communication-message-status-m-2')).toContainText('Enviada');

    const initialMessages = calls.messages;
    calls.setMessageStatus('read');
    await emitRealtimeEvent(page, 'MessageStatusUpdated', { conversation_id: 'c-1', message_id: 'm-2' });

    await expect.poll(() => calls.messages).toBeGreaterThan(initialMessages);
    await expect(page.getByTestId('communication-message-status-m-2')).toContainText('Lida');
  });

  test('troca de conversa desassina canal anterior', async ({ page }) => {
    await enableRealtimeTestProvider(page);
    await mockAuth(page);
    await mockInbox(page);

    await page.goto('/communication/inbox');
    await expect.poll(async () => {
      const state = await getRealtimeTestState(page);
      return state?.channels.includes('conversation.c-1');
    }).toBeTruthy();

    await page.getByTestId('communication-conversation-list').getByText('Bruno Cliente').click();

    await expect.poll(async () => {
      const state = await getRealtimeTestState(page);
      return Boolean(
        state?.unsubscribed.includes('conversation.c-1') &&
        state.channels.includes('conversation.c-2') &&
        !state.channels.includes('conversation.c-1'),
      );
    }).toBeTruthy();
  });

  test('exibe painel de detalhes da conversa selecionada', async ({ page }) => {
    await mockAuth(page);
    await mockInbox(page);

    await page.goto('/communication/inbox');

    await openConversationDetails(page);
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

  test('mensagem outbound sent mostra enviada', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page, { messageStatus: 'sent' });

    await page.goto('/communication/inbox');

    await expect.poll(() => calls.messages).toBeGreaterThan(0);
    await expect(page.getByTestId('communication-message-status-m-2')).toContainText('Enviada');
  });

  test('mensagem outbound delivered mostra entregue', async ({ page }) => {
    await mockAuth(page);
    await mockInbox(page, { messageStatus: 'delivered' });

    await page.goto('/communication/inbox');

    await expect(page.getByTestId('communication-message-status-m-2')).toContainText('Entregue');
  });

  test('mensagem outbound read mostra lida', async ({ page }) => {
    await mockAuth(page);
    await mockInbox(page, { messageStatus: 'read' });

    await page.goto('/communication/inbox');

    await expect(page.getByTestId('communication-message-status-m-2')).toContainText('Lida');
  });

  test('mensagem outbound failed mostra falhou', async ({ page }) => {
    await mockAuth(page);
    await mockInbox(page, { messageStatus: 'failed' });

    await page.goto('/communication/inbox');

    await expect(page.getByTestId('communication-message-status-m-2')).toContainText('Falhou');
  });

  test('mensagem inbound nao mostra status de entrega', async ({ page }) => {
    await mockAuth(page);
    await mockInbox(page);

    await page.goto('/communication/inbox');

    await expect(page.getByTestId('communication-message-status-m-1')).toHaveCount(0);
    await expect(page.getByTestId('communication-message-list')).toContainText('Preciso remarcar meu horario');
  });

  test('aba Timeline aparece, chama endpoint e renderiza eventos', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page);

    await page.goto('/communication/inbox');

    await openConversationMenu(page);
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
    await openConversationMenu(page);
    await page.getByTestId('communication-tab-timeline').click();

    await expect.poll(() => calls.timeline).toBe(1);
    await expect(page.getByTestId('communication-timeline-empty')).toBeVisible();
  });

  test('timeline renderiza erro seguro', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page, { failTimeline: true });

    await page.goto('/communication/inbox');
    await openConversationMenu(page);
    await page.getByTestId('communication-tab-timeline').click();

    await expect.poll(() => calls.timeline).toBe(1);
    await expect(page.getByTestId('communication-timeline-error')).toBeVisible();
    await expect(page.getByText('Nao foi possivel carregar a timeline.')).toBeVisible();
  });

  test('renderiza botoes de acao', async ({ page }) => {
    await mockAuth(page);
    await mockInbox(page);

    await page.goto('/communication/inbox');

    await openConversationMenu(page);
    await expect(page.getByTestId('communication-action-assign')).toBeVisible();
    await expect(page.getByTestId('communication-action-handoff')).toBeVisible();
    await expect(page.getByTestId('communication-action-transfer')).toBeVisible();
    await expect(page.getByTestId('communication-action-return-ai')).toBeVisible();
    await expect(page.getByTestId('communication-action-close')).toBeVisible();
  });

  test('abre modal de transferencia e lista assignees', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page);

    await page.goto('/communication/inbox');
    await openConversationMenu(page);
    await page.getByTestId('communication-action-transfer').click();

    await expect(page.getByTestId('communication-transfer-modal')).toBeVisible();
    await expect(page.getByTestId('communication-transfer-modal')).toContainText('Responsavel atual: Marina');
    await expect.poll(() => calls.assignees).toBe(1);
    await expect(page.getByTestId('communication-assignee-list')).toContainText('Marina');
    await expect(page.getByTestId('communication-assignee-list')).toContainText('Carlos Atendimento');
  });

  test('busca assignee no endpoint novo', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page);

    await page.goto('/communication/inbox');
    await openConversationMenu(page);
    await page.getByTestId('communication-action-transfer').click();
    await page.getByTestId('communication-assignee-search').fill('Carlos');

    await expect.poll(() => calls.assigneeQueries.some(query => query.includes('search=Carlos'))).toBeTruthy();
    await expect(page.getByTestId('communication-assignee-list')).toContainText('Carlos Atendimento');
  });

  test('transfere conversa e recarrega dados principais', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page);

    await page.goto('/communication/inbox');
    await openConversationMenu(page);
    await page.getByTestId('communication-action-transfer').click();
    await page.getByTestId('communication-assignee-u-2').click();
    await page.getByTestId('communication-transfer-confirm').click();

    await expect.poll(() => calls.transfer).toBe(1);
    await expect.poll(() => calls.summary).toBeGreaterThan(1);
    await expect.poll(() => calls.conversations).toBeGreaterThan(1);
    await expect(page.getByTestId('communication-transfer-modal')).toHaveCount(0);
    await openConversationDetails(page);
    await expect(page.getByTestId('communication-conversation-details')).toContainText('Carlos Atendimento');
  });

  test('erro na transferencia exibe mensagem segura', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page, { failTransfer: true });

    await page.goto('/communication/inbox');
    await openConversationMenu(page);
    await page.getByTestId('communication-action-transfer').click();
    await page.getByTestId('communication-assignee-u-2').click();
    await page.getByTestId('communication-transfer-confirm').click();

    await expect.poll(() => calls.transfer).toBe(1);
    await expect(page.getByTestId('communication-transfer-modal')).toBeVisible();
    await expect(page.getByTestId('communication-transfer-error')).toBeVisible();
  });

  test('conversa fechada nao permite transferencia', async ({ page }) => {
    await mockAuth(page);
    await mockInbox(page, { closed: true });

    await page.goto('/communication/inbox');

    await openConversationMenu(page);
    await expect(page.getByTestId('communication-action-transfer')).toHaveCount(0);
    await expect(page.getByTestId('communication-action-reopen')).toBeVisible();
  });

  test('assign chama API e refaz chamadas principais', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page);

    await page.goto('/communication/inbox');
    await openConversationMenu(page);
    await page.getByTestId('communication-action-assign').click();

    await expect.poll(() => calls.assign).toBe(1);
    await expect.poll(() => calls.summary).toBeGreaterThan(1);
    await expect.poll(() => calls.conversations).toBeGreaterThan(1);
    await openConversationDetails(page);
    await expect(page.getByTestId('communication-conversation-details')).toContainText('Admin Master');
  });

  test('request handoff chama API e atualiza UI', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page);

    await page.goto('/communication/inbox');
    await openConversationMenu(page);
    await page.getByTestId('communication-action-handoff').click();

    await expect.poll(() => calls.handoff).toBe(1);
    await expect.poll(() => calls.summary).toBeGreaterThan(1);
    await openConversationDetails(page);
    await expect(page.getByTestId('communication-conversation-details')).toContainText('Aguardando humano');
  });

  test('mostra botao Voltar para IA em conversa humana', async ({ page }) => {
    await mockAuth(page);
    await mockInbox(page);

    await page.goto('/communication/inbox');

    await openConversationDetails(page);
    await expect(page.getByTestId('communication-conversation-details')).toContainText('Humano');
    await page.getByLabel('Fechar informacoes').click();
    await openConversationMenu(page);
    await expect(page.getByTestId('communication-action-return-ai')).toBeVisible();
  });

  test('voltar para IA chama API e atualiza UI', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page);
    page.on('dialog', dialog => dialog.accept());

    await page.goto('/communication/inbox');
    await openConversationMenu(page);
    await page.getByTestId('communication-action-return-ai').click();

    await expect.poll(() => calls.returnToAi).toBe(1);
    await expect.poll(() => calls.messages).toBeGreaterThan(1);
    await expect.poll(() => calls.summary).toBeGreaterThan(1);
    await expect.poll(() => calls.conversations).toBeGreaterThan(1);
    await openConversationDetails(page);
    await expect(page.getByTestId('communication-conversation-details')).toContainText('IA');
    await expect(page.getByTestId('communication-composer-ai')).toBeVisible();
    await expect(page.getByTestId('communication-message-input')).toBeDisabled();
  });

  test('erro ao voltar para IA exibe mensagem segura', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page, { failReturnToAi: true });
    page.on('dialog', dialog => dialog.accept());

    await page.goto('/communication/inbox');
    await openConversationMenu(page);
    await page.getByTestId('communication-action-return-ai').click();

    await expect.poll(() => calls.returnToAi).toBe(1);
    await expect(page.getByTestId('communication-action-error')).toBeVisible();
    await openConversationMenu(page);
    await expect(page.getByTestId('communication-action-return-ai')).toBeVisible();
  });

  test('close chama API e exibe reabrir', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page);
    page.on('dialog', dialog => dialog.accept());

    await page.goto('/communication/inbox');
    await openConversationMenu(page);
    await page.getByTestId('communication-action-close').click();

    await expect.poll(() => calls.close).toBe(1);
    await openConversationMenu(page);
    await expect(page.getByTestId('communication-action-reopen')).toBeVisible();
  });

  test('reopen chama API e volta a exibir fechar', async ({ page }) => {
    await mockAuth(page);
    const calls = await mockInbox(page, { closed: true });

    await page.goto('/communication/inbox');
    await openConversationMenu(page);
    await page.getByTestId('communication-action-reopen').click();

    await expect.poll(() => calls.reopen).toBe(1);
    await openConversationMenu(page);
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
    await expect(page.getByTestId('communication-message-status-m-3')).toContainText('Enviada');
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


