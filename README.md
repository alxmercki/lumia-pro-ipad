# Lumia Pro iPad

Pads de áudio para palco no iPad, derivado do Lumia Pro v5. Um arquivo HTML, sem build.

## Abrir no iPad
1. Abra o endereço do GitHub Pages no Safari (iPad na horizontal).
2. Compartilhar › **Adicionar à Tela de Início** para abrir em tela cheia, como app.
3. Depois de abrir uma vez com internet, funciona offline.

## O que faz
- Até 3 janelas de pads redimensionáveis, 6 bancos de 24 pads, master por janela e master geral.
- Toque: 1º cue, 2º play, 3º stop, ou por pad "toca direto" no 1º toque. Outro pad na mesma janela para o atual.
- Loop ON/OFF por pad, stop seco ou com fade, fade in/out, velocidade, IN/OUT.
- Time code da faixa em cada janela: decorrido e restante, âmbar nos últimos 30 s e vermelho nos últimos 10 s.
- Organizar: reordena pads entre posições, bancos e janelas.
- Projetos: salvar no iPad ou em arquivo `.lumia.json` (HD, Dropbox, Drive pelo app Arquivos), salvar como, abrir, recentes.
- Músicas pelo app Arquivos (iPad, HD, iCloud, Dropbox, Google Drive). Opcional: não guardar no iPad e conectar as músicas a cada sessão, selecionando todas de uma vez.

## Limites conhecidos
- Um app web no iPad não guarda acesso permanente a pastas do HD ou da nuvem (o Safari não tem File System Access API). No modo sem cópia, ao abrir o projeto o app pede a pasta do HD ou da nuvem (iPadOS 18.4 ou mais novo) e reconecta tudo pelo nome; esse passo se repete a cada abertura.
- MIDI (nanoKONTROL2): o mapa está no código, mas o Safari do iPad não tem Web MIDI. Funciona em Chrome/Edge no computador; no iPad só com app nativo.
- Busca direta no Google Drive só existe na versão dentro do Claude (usa o conector do Claude).
- Com a tela bloqueada ou o Safari em segundo plano, o som pode parar.
