# Escritório 3D

Experiência interativa do Observatório da Indústria com escritório 3D, personagem animado, transição por rolagem e sala de dados. O projeto também reúne cenas de edifício, relevo, hologramas e um globo com consulta de CNPJ.

## Executar localmente

```sh
npm install
npm run dev
```

Abra o endereço exibido no terminal e acesse `/#/escritorio` para ver o escritório. Role a página para acompanhar o personagem até a sala de dados.

## Verificações e compilação

```sh
npm run typecheck
npm run lint
npm run build
```

A compilação é gerada em `dist/`. Para visualizar essa versão localmente, execute `npm run preview`.

## Rotas

- `/#/escritorio`: escritório e sala de dados.
- `/#/colaboracao`: estúdio de dados 3D inspirado em uma ilustração de colaboração, com duas pessoas, notebooks, painel de dados e plantas.
- `/#/`: globo e consulta de CNPJ.
- `/#/edificio`: edifício de partículas.
- `/#/relevo`: relevo 3D.
- `/#/rosto`: rosto holográfico.
- `/#/aria`: Aria 3D.
- `/#/robo`: robô interativo.

As consultas de CNPJ e a localização no mapa dependem de serviços externos e de conexão com a internet.

## Repositório

[Princyrr/project_escritorio3d](https://github.com/Princyrr/project_escritorio3d)

Use Conventional Commits com descrições em inglês, por exemplo: `feat(office): animate the laboratory presenter`.

## Estúdio de dados 3D

A nova cena fica em `src/components/CollaborationScene.tsx`, com a página em `CollaborationPage.tsx`. É construída com geometria Three.js, React Three Fiber e texturas de gráficos desenhadas em canvas, sem modelos ou serviços externos. Os dados dos painéis são ilustrativos.

Arraste para girar a câmera, use o zoom para ver os detalhes e os controles para pausar os movimentos ou restaurar a visão. A animação começa pausada quando o navegador indica preferência por movimento reduzido.

## Estúdio animado 2D

A rota `/#/estudio-2d` exibe `AnimatedStudioPage.tsx`, uma ilustração SVG original em camadas, com animações CSS de plantas, pessoas, gráficos e cartões. Inclui pausa e respeita movimento reduzido. A versão 3D permanece em `/#/colaboracao`.

## Sala de trabalho 3D

A rota `/#/sala-trabalho` abre `WorkroomPage.tsx`: sala inspirada na referência, com quatro estações, divisórias, monitores, cadeiras e cobogós vazados modelados em Three.js. Arraste para girar e use o zoom. Os controles alternam monitores e luz, e restauram a câmera. Texturas e telas são desenhadas localmente, sem dependência de serviços externos.

## Bosque encantado

`/#/bosque` abre `EnchantedForestPage.tsx`: ilustração de floresta em camadas, com paralaxe, luzes, pássaro animado, partículas ao clicar e três atmosferas. Os controles pausam os efeitos e o movimento; o componente respeita movimento reduzido. Cards abrem detalhes em uma janela acessível. A arte fica em `src/assets/enchanted-forest.png`, os estilos em `components/enchanted-forest.css`.
