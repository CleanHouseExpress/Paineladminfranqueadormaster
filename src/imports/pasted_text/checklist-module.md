# Implementar Módulo Core: Checklists Operacionais (Fase 1)

## Objetivo

Implementar o primeiro módulo operacional completo da Orchestra.

Este módulo será utilizado por todas as empresas da plataforma.

Importante:

```txt
Checklists Operacionais é um módulo Core.
```

Portanto:

```txt
is_core = true
is_required = true
can_disable = false
```

Não depende de plano.

Toda empresa criada deve possuir acesso ao módulo.

---

# Contexto Atual

Já existe:

* Multi Tenant
* Tenant Context
* RBAC
* Audit Log
* Metadata Engine
* Users
* Units
* Customers
* Users x Units
* Customers x Units
* DynamicFormRenderer
* DynamicTableRenderer

A arquitetura necessária já está pronta.

---

# Objetivo de Negócio

Permitir que a rede:

* crie modelos de checklist
* execute checklists nas unidades
* acompanhe conformidade
* acompanhe pendências
* audite execuções

Exemplos:

```txt
Checklist de abertura

Checklist de fechamento

Checklist de limpeza

Checklist de estoque

Checklist de manutenção

Checklist de auditoria
```

---

# Diretriz Principal

NÃO criar formulários hardcoded.

Todo checklist deve ser configurável.

A Metadata Engine deve ser utilizada desde a primeira versão.

---

# Estrutura Backend

## 1. Checklist Templates

Criar tabela tenant:

```txt
checklist_templates
```

Campos:

```txt
id

name
description

category

active

created_by
updated_by

created_at
updated_at
```

---

## 2. Checklist Executions

Criar tabela tenant:

```txt
checklist_executions
```

Campos:

```txt
id

template_id

unit_id

user_id

status

score

started_at
completed_at

created_at
updated_at
```

Status:

```txt
draft
in_progress
completed
approved
cancelled
```

---

## 3. Checklist Answers

Criar tabela tenant:

```txt
checklist_answers
```

Campos:

```txt
id

execution_id

field_key

field_label

field_type

value

created_at
updated_at
```

Value pode permanecer JSON.

---

# Metadata Engine

Criar suporte para:

```txt
entity_key = checklist_template
```

ou

```txt
entity_key = checklist_template_{id}
```

Conforme a arquitetura atual.

Cada template terá:

```json
[
  {
    "key": "door_open",
    "label": "Porta aberta",
    "type": "boolean",
    "required": true
  }
]
```

---

# Tipos Permitidos

Reutilizar Metadata Engine.

Suportar:

```txt
text
textarea
number
currency
date
datetime
boolean
select
multiselect
phone
document
photo
signature
```

Se photo/signature ainda não existirem:

Criar suporte básico.

Armazenar apenas referência.

Não implementar upload avançado nesta fase.

---

# Backend Services

Criar:

```txt
ChecklistTemplateService
ChecklistExecutionService
```

Responsabilidades:

Template:

```txt
CRUD
Ativar
Desativar
Metadata
```

Execução:

```txt
Iniciar

Salvar respostas

Concluir

Consultar
```

---

# Controllers

Criar:

```txt
ChecklistTemplateController

ChecklistExecutionController
```

---

# Rotas

Templates

```txt
GET    /api/company/checklists/templates

GET    /api/company/checklists/templates/{id}

POST   /api/company/checklists/templates

PUT    /api/company/checklists/templates/{id}

DELETE /api/company/checklists/templates/{id}
```

Execuções

```txt
GET    /api/company/checklists/executions

GET    /api/company/checklists/executions/{id}

POST   /api/company/checklists/executions

PUT    /api/company/checklists/executions/{id}

POST   /api/company/checklists/executions/{id}/complete
```

---

# Relacionamentos

Template

```txt
belongsTo User(created_by)
```

Execução

```txt
belongsTo Template

belongsTo Unit

belongsTo User
```

Respostas

```txt
belongsTo Execution
```

---

# RBAC

Criar permissões:

```txt
tenant.checklists.view

tenant.checklists.create

tenant.checklists.update

tenant.checklists.delete

tenant.checklists.execute

tenant.checklists.approve

tenant.checklists.configure
```

Atribuir ao:

```txt
company_admin
```

---

# Audit Log

Registrar:

```txt
tenant.checklists.created

tenant.checklists.updated

tenant.checklists.deleted

tenant.checklists.execution_started

tenant.checklists.execution_completed
```

Metadata:

```json
{
  "section": "checklists"
}
```

---

# Metadata Seed

Criar metadata padrão:

```txt
entity_key = checklists
```

Labels:

```txt
Checklist
Checklists
```

Tabela:

```txt
Nome

Categoria

Status

Criado em
```

---

# Frontend

Criar módulo:

```txt
src/modules/checklists
```

---

# Rotas

```txt
/checklists

/checklists/templates

/checklists/templates/new

/checklists/templates/:id

/checklists/executions

/checklists/executions/:id
```

---

# Templates

Listagem usando:

```txt
DynamicTableRenderer
```

Cadastro usando:

```txt
Metadata Engine
```

---

# Execução

Tela de execução:

```txt
Seleciona Template

Seleciona Unidade

Carrega schema

Renderiza formulário

Salva respostas

Concluir
```

Utilizar:

```txt
DynamicFormRenderer
```

Não criar formulário fixo.

---

# Dashboard Inicial

Criar indicadores:

```txt
Checklists executados hoje

Checklists pendentes

Checklists concluídos

Últimas execuções
```

Pode ser simples.

---

# Testes Backend

Cobrir:

* CRUD Template
* Ativar/Desativar
* Execução
* Respostas
* Complete
* Permissões
* Tenant Isolation
* Audit Log

Todos os testes existentes devem continuar passando.

---

# Testes Frontend

Validar:

```txt
npm run build
```

Sem erros.

---

# Entrega Esperada

Informar:

1. Arquivos criados
2. Migrations criadas
3. Endpoints criados
4. Permissões criadas
5. Eventos Audit Log criados
6. Como Metadata Engine foi utilizada
7. Como DynamicFormRenderer foi reutilizado
8. Resultado do php artisan test
9. Resultado do npm run build

---

# Não Implementar Nesta Fase

Não implementar:

```txt
Workflow

Aprovação multinível

Plano de ação

Não conformidades

SLA

Assinatura eletrônica

Escalonamento

Notificações
```

Esses recursos serão Fase 2.

Objetivo desta entrega:

```txt
Criar a fundação operacional dos Checklists utilizando a Metadata Engine e a arquitetura já construída da Orchestra.
```
