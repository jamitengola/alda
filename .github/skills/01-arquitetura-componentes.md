# Skill 01 — Arquitetura de Componentes e Navegação

## Problema
Tudo está num único `page.tsx` de 317 linhas. Sem navegação, sem componentes reutilizáveis.

## Objetivo
Refatorar para arquitetura modular com sidebar e páginas dedicadas.

## Estrutura alvo

```
src/
├── app/
│   ├── layout.tsx           ← layout global com Sidebar
│   ├── page.tsx             ← dashboard resumo
│   ├── transcricao/
│   │   └── page.tsx         ← módulo 1
│   ├── assistente/
│   │   └── page.tsx         ← módulo 2
│   ├── estudos/
│   │   └── page.tsx         ← módulo 3
│   ├── followup/
│   │   └── page.tsx         ← módulo 4
│   ├── conhecimento/
│   │   └── page.tsx         ← módulo 5
│   └── api/                 ← já existe
├── components/
│   ├── Sidebar.tsx
│   ├── PageHeader.tsx
│   ├── ProviderBadge.tsx
│   ├── LoadingButton.tsx
│   └── ResultCard.tsx
└── lib/                     ← já existe
```

## Regras
- Cada módulo é uma página separada em `src/app/<modulo>/page.tsx`
- Componentes partilhados ficam em `src/components/`
- Sidebar sempre visível com ícones + labels
- Layout global carrega provider status uma vez
- Cada página é `"use client"` e autossuficiente
- Dashboard (`page.tsx`) mostra resumo rápido dos 5 módulos
