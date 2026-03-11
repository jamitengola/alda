# Skill 06 — UI Polish (Dark Mode, Feedback Visual)

## Problema
Interface básica sem identidade visual, sem dark mode toggle, sem feedback ao utilizador.

## Melhorias

### Dark mode toggle
- Botão no header para alternar claro/escuro
- Persistir preferência em localStorage
- Respeitar `prefers-color-scheme` como default

### Feedback visual
- Toast/notificação ao concluir ações (ex: "Resumo gerado", "Conhecimento salvo")
- Skeleton loading nos cards enquanto LLM responde
- Animação suave nas transições de estado
- Badge de provider (mock/ollama/openai) sempre visível

### Identidade visual
- Cor primária: azul (#2563eb) para ações, verde para sucesso
- Tipografia consistente com Geist (já configurado)
- Ícones com lucide-react (leve, MIT)
- Logo/marca ALDA no topo da sidebar

### Componentes de UI necessários
- `Toast.tsx` — notificações temporárias
- `Skeleton.tsx` — placeholder durante loading
- `Badge.tsx` — labels coloridos (provider, prioridade)
- `ThemeToggle.tsx` — botão dark/light mode
