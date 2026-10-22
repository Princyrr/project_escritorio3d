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
