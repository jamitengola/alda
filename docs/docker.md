# Executar o ALDA com Docker

Este guia permite executar o ALDA sem instalar Node.js ou dependências nativas directamente na máquina.

## Requisitos

- Docker Desktop, Docker Engine ou uma alternativa compatível com Compose.
- Porta `3000` disponível.

## Início rápido em modo mock

O modo mock não precisa de chaves externas e é a forma recomendada de validar a instalação.

```bash
docker compose up --build
```

Depois, abra `http://localhost:3000`.

Para encerrar:

```bash
docker compose down
```

## Usar um fornecedor compatível com OpenAI

Crie um ficheiro `.env` na raiz do projecto:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=adicione_a_chave_aqui
OPENAI_MODEL=gpt-4.1-mini
```

Depois execute:

```bash
docker compose up --build
```

Não faça commit do ficheiro `.env`.

## Usar Ollama no computador anfitrião

Primeiro, inicie o Ollama e confirme que o modelo está disponível:

```bash
ollama pull llama3.1:8b
```

Configure o `.env`:

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=llama3.1:8b
```

O Compose já inclui o mapeamento `host.docker.internal` para ambientes Linux compatíveis.

## Construir e executar sem Compose

```bash
docker build -t alda .
docker run --rm -p 3000:3000 -e AI_PROVIDER=mock alda
```

## Variáveis principais

| Variável | Valor padrão | Finalidade |
|---|---:|---|
| `AI_PROVIDER` | `mock` | Selecciona `mock`, `openai` ou `ollama`. |
| `OPENAI_API_KEY` | vazio | Chave para o fornecedor OpenAI-compatible. |
| `OPENAI_MODEL` | `gpt-4.1-mini` | Modelo cloud utilizado. |
| `OLLAMA_BASE_URL` | `http://host.docker.internal:11434` | Endereço do Ollama. |
| `OLLAMA_MODEL` | `llama3.1:8b` | Modelo local utilizado. |
| `AI_REQUEST_TIMEOUT_MS` | `15000` | Tempo máximo de cada pedido de IA. |
| `AI_REQUEST_MAX_RETRIES` | `1` | Número máximo de novas tentativas. |
| `AI_REQUEST_RETRY_DELAY_MS` | `250` | Espera inicial entre tentativas. |

## Resolução de problemas

### A porta 3000 já está ocupada

Altere o lado esquerdo do mapeamento no `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"
```

Depois abra `http://localhost:3001`.

### O container não consegue comunicar com Ollama

Confirme que o Ollama aceita ligações fora de `localhost` e que a firewall permite o acesso. Em Linux, confirme também que a versão do Docker suporta `host-gateway`.

### Erro ao compilar `better-sqlite3`

A imagem de dependências instala `python3`, `make` e `g++` para compilar módulos nativos. Faça uma reconstrução limpa:

```bash
docker compose build --no-cache
docker compose up
```

### Mudanças de código não aparecem

O Dockerfile actual é orientado a produção. Reconstrua a imagem depois de alterar o código:

```bash
docker compose up --build
```
