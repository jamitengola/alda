# Skill 07 — Follow-up com Exportação

## Problema
O follow-up é gerado mas não pode ser copiado, exportado ou enviado.

## Melhorias
1. **Copiar para clipboard** — botão "Copiar" ao lado do follow-up gerado
2. **Exportar como .txt/.md** — download do ficheiro formatado
3. **Abrir no email** — `mailto:` link com subject e body pré-preenchidos
4. **Histórico** — listar follow-ups anteriores (depende de Skill 04 - SQLite)

## Implementação
```typescript
// Copiar
navigator.clipboard.writeText(followupText);

// Download
const blob = new Blob([followupText], { type: 'text/markdown' });
const url = URL.createObjectURL(blob);
// trigger download

// Email
const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
window.open(mailto);
```
