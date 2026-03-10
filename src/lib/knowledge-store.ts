export type KnowledgeItem = {
  id: string;
  source: string;
  content: string;
  createdAt: string;
};

const knowledgeItems: KnowledgeItem[] = [];

export function listKnowledgeItems() {
  return [...knowledgeItems].reverse();
}

export function addKnowledgeItem(source: string, content: string) {
  const item: KnowledgeItem = {
    id: crypto.randomUUID(),
    source,
    content,
    createdAt: new Date().toISOString(),
  };

  knowledgeItems.push(item);
  return item;
}

export function queryKnowledge(query: string) {
  const normalized = query.toLowerCase().trim();

  if (!normalized) {
    return "Escreva uma pergunta para consultar sua base de conhecimento.";
  }

  const matches = knowledgeItems.filter((item) => {
    return (
      item.source.toLowerCase().includes(normalized) ||
      item.content.toLowerCase().includes(normalized)
    );
  });

  if (matches.length === 0) {
    return "Não encontrei conteúdos diretamente relacionados. Tente termos mais específicos.";
  }

  const top = matches.slice(-3).reverse();
  const bullets = top
    .map((item, index) => `${index + 1}. [${item.source}] ${item.content}`)
    .join("\n");

  return `Encontrei estes pontos relevantes:\n${bullets}`;
}

export function getKnowledgeMatches(query: string, limit = 5) {
  const normalized = query.toLowerCase().trim();
  if (!normalized) {
    return [];
  }

  return knowledgeItems
    .filter((item) => {
      return (
        item.source.toLowerCase().includes(normalized) ||
        item.content.toLowerCase().includes(normalized)
      );
    })
    .slice(-limit)
    .reverse();
}