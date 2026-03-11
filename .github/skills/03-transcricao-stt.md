# Skill 03 — Transcrição de Áudio (STT Local)

## Problema
O módulo de transcrição é um textarea manual — não faz transcrição real.

## Objetivo
Permitir gravar áudio ao vivo ou fazer upload de ficheiro e obter transcrição automática.

## Abordagens (por ordem de praticidade)

### Opção A — Web Speech API (mais rápida para MVP)
- Usa `webkitSpeechRecognition` / `SpeechRecognition` do browser
- Funciona sem instalar nada extra
- Limitações: só Chrome/Edge, precisa internet para alguns idiomas
- Ideal para: gravação ao vivo em tempo real

### Opção B — Whisper via Ollama (offline completo)
- Precisa de endpoint Whisper-compatible ou modelo speech no Ollama
- Alternativa: `openai/whisper` rodando localmente via Python
- Ideal para: upload de ficheiros de áudio

### Implementação MVP (Opção A)
```typescript
// No componente de transcrição:
const recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'pt-BR';

recognition.onresult = (event) => {
  // Acumular texto transcrito
};
```

### Fluxo
1. Botão "Gravar" → inicia Web Speech API
2. Texto aparece em tempo real no textarea
3. Botão "Parar" → finaliza gravação
4. Botão "Gerar resumo" → envia transcrição para `/api/transcribe-summary`
5. Upload de ficheiro: drag & drop de .mp3/.wav → enviar para endpoint Whisper

### UI necessária
- Indicador visual de gravação (pulsing dot)
- Contador de tempo
- Preview do texto sendo transcrito
- Botão alternar entre "digitar" e "gravar"
