# Skill 05 — Desktop Real com Electron

## Problema
O Electron atual é apenas um wrapper que abre `localhost:3000` — sem funcionalidades desktop.

## Objetivo
Transformar num app desktop nativo com system tray, atalhos e overlay.

## Features alvo

### System Tray
- Ícone na barra do sistema
- Menu: Abrir ALDA, Iniciar gravação, Configurações, Sair
- Click no ícone abre/esconde janela

### Atalhos globais
- `Cmd+Shift+A` — abrir/esconder ALDA
- `Cmd+Shift+R` — iniciar/parar gravação rápida
- `Cmd+Shift+Q` — pergunta rápida ao assistente

### Overlay flutuante
- Janela pequena semi-transparente sempre visível
- Mostra sugestão do assistente em tempo real
- Arrastável, redimensionável
- Toggle via tray ou atalho

### Implementação
```javascript
// System Tray
const tray = new Tray(path.join(__dirname, 'icon.png'));
const contextMenu = Menu.buildFromTemplate([
  { label: 'Abrir ALDA', click: () => mainWindow.show() },
  { label: 'Gravação rápida', click: () => startRecording() },
  { type: 'separator' },
  { label: 'Sair', click: () => app.quit() }
]);
tray.setContextMenu(contextMenu);

// Atalhos globais
globalShortcut.register('CommandOrControl+Shift+A', () => {
  mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
});
```

### Prioridade
1. System tray + atalho abrir/esconder (essencial)
2. Atalho gravação rápida (útil)
3. Overlay flutuante (nice-to-have)
