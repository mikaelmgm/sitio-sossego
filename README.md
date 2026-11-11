# Sítio Sossego

Wallpaper interativo em pixel art para o [Wallpaper Engine](https://www.wallpaperengine.io/): um sítio que vive na área de trabalho, reage ao mouse e à música que está tocando.

*An interactive pixel-art farm wallpaper for Wallpaper Engine. Draw a circle to spawn a sheep, drag the animals around, flip day and night with a glass switch, and watch the farm react to your music.*

Sem bibliotecas: WebGL2 puro, Canvas 2D e Web Audio. Toda a arte é desenhada por código e todo o som é sintetizado ao vivo.

## O que dá para fazer

| Gesto | O que acontece |
| --- | --- |
| Desenhar um círculo | Nasce uma ovelha (às vezes preta, rosa ou menta) |
| Arrastar um bicho | Pega e solta em outro lugar; no lago dá splash |
| Clicar num bicho | Ele reage; a galinha pode botar um ovo, e o ovo vira pintinho |
| Riscar rápido na horizontal | Rajada de vento: nuvens, grama, varal, moinho e balanço |
| Clicar no cenário | Balanço, copa da árvore, nuvem, lago, sol/lua, janela, chaminé, porta e moinho respondem |
| Clicar na grama vazia | Planta uma flor |

Botões de vidro no canto superior direito: som ambiente, chuva, interruptor dia/noite e volume.

Quando há música tocando (Spotify etc.), o nome aparece no canto, os bichos dançam, os vaga-lumes pulsam e saem notinhas da cabana. Ligue a integração de mídia nas configurações do Wallpaper Engine.

## Instalar

1. Baixe ou clone este repositório numa pasta chamada `sitio-sossego`.
2. Coloque a pasta em `wallpaper_engine\projects\myprojects` (Steam → botão direito no Wallpaper Engine → Gerenciar → Explorar arquivos locais).
3. Reabra o Wallpaper Engine e escolha **Sítio Sossego** em Instalados.

Funciona em 1920×1080, 2560×1440 e 4K: a cena se ajusta para os pixels ficarem sempre inteiros.

Para ver no navegador, sirva a pasta com qualquer servidor estático e abra `index.html?demo` (o modo demo simula uma música).

## Volume do Windows (opcional)

Um wallpaper não pode mexer no volume do sistema. Sem o ajudante, o botão de volume controla só o som do próprio sítio. Para ele controlar o volume do Windows:

1. Rode `helper\Compilar.cmd` (usa o compilador C# que já vem no Windows).
2. Rode `helper\Ligar volume.cmd`.

O ajudante (`helper\SitioVolume.cs`) escuta apenas em `127.0.0.1:38917`, só lê e altera o volume, e exige uma senha aleatória gerada no seu PC em `helper\token.js`. Esse arquivo e o exe ficam fora do repositório.

## Estrutura

| Arquivo | Papel |
| --- | --- |
| `js/gl.js` | Iluminação da cena e os botões de vidro (shaders) |
| `js/ui.js` | Lógica dos botões: molas, arrasto e arte dos trilhos |
| `js/world.js`, `js/sky.js`, `js/props.js`, `js/scene.js` | Colinas, chão, céu, construções e cena viva |
| `js/animals.js`, `js/critters.js`, `js/sprites.js` | Bichos e seus sprites |
| `js/weather.js`, `js/fx.js` | Vento, chuva e partículas |
| `js/audio.js`, `js/sfx.js` | Som ambiente e efeitos sintetizados |
| `js/media.js` | Integração com o Wallpaper Engine e com o ajudante de volume |
| `js/input.js` | Mouse: cliques, arrasto, círculo e risco de vento |
