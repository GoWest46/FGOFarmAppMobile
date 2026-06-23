# FGOFarmAppMobile

Aplicativo mobile em Expo/React Native para montar composições de Fate/Grand Order e simular execuções de farm por wave. O projeto ainda usa uma base local de dados, sem conexão com a API Atlas.

## Objetivo

O app ajuda a testar se uma composição consegue limpar um node de farm, considerando:

- seleção de servants na frontline e backline;
- Craft Essences com bônus de ATK/HP, bateria inicial e buffs passivos;
- níveis de NP e níveis de skills;
- cooldowns, buffs ativos e duração por turno/ataque;
- seleção de node, waves, fields e inimigos;
- fila de comandos com skills e Noble Phantasms;
- cálculo de dano, overkill e refund de NP;
- relatório por wave com dano total e gauge final dos servants.

## Stack

- Expo SDK `~56.0.4`
- React `19.2.3`
- React Native `0.85.3`
- TypeScript `~6.0.3`
- React Navigation Native Stack
- `@react-native-picker/picker`

O `tsconfig.json` estende `expo/tsconfig.base`, usa `strict: true` e permite importação de JSON com `resolveJsonModule`.

## Requisitos

De acordo com a documentação versionada do Expo SDK 56, esta versão usa Node.js mínimo `22.13.x`.

Instale as dependências com:

```bash
npm install
```

## Como rodar

```bash
npm start
```

Atalhos disponíveis:

```bash
npm run android
npm run ios
npm run web
```

O app está configurado em `app.json` com orientação padrão portrait, tema claro, assets em `assets/` e updates desativados (`updates.enabled: false`).

## Fluxo do app

### 1. Montagem do time

A tela inicial (`TeamSetupScreen.tsx`) permite:

- carregar uma composição pronta de `DataBase/DBcomps.ts`;
- customizar seis slots de party, sendo três frontline e três backline;
- escolher servant, Craft Essence, NP level e skill levels;
- alternar o estado MLB da Craft Essence;
- validar regras básicas de duplicação de servants na party;
- iniciar uma sessão de node quando a frontline está completa.

Quando uma Craft Essence é equipada, os bônus de status e efeitos iniciais são aplicados ao servant ativo. CEs com `npCharge`, por exemplo, atualizam a barra inicial respeitando o teto do NP level.

### 2. Seleção do node

Os nodes vêm de `DataBase/DBNodes.json`. Cada node contém waves, fields e inimigos com classe e HP customizados. A criação do estado vivo da luta fica em `AppEmSI/NodeSetup.tsx`.

A tela mostra a estrutura carregada das waves, os fields e o HP atual dos inimigos. Após finalizar uma wave, o app atualiza o estado do time, reduz cooldowns/durações e avança para a próxima wave.

### 3. Comandos de batalha

A tela `PlayerCommandsScreen.tsx` recebe a party e o node ativo. Ela permite:

- adicionar skills S1/S2/S3 na fila;
- selecionar alvo aliado ou inimigo quando o efeito exige alvo;
- bloquear novas skills quando um NP já está na fila;
- abrir o deck de NP pelo botão `ATTACK`;
- adicionar NP se o servant tiver pelo menos 100% de gauge;
- deletar comando selecionado ou limpar a fila;
- executar a fila inteira com `Done`.

A fila visual e a fila de efeitos são gerenciadas por `QueueContext.tsx`.

## Motor de batalha

O núcleo da simulação está em `AppEmSI/BattleOrganizer.ts`.

Ele processa cada item da fila e retorna:

- party atualizada;
- node atualizado;
- log de batalha;
- indicação de wave finalizada ou falha;
- lista de slots/servants que usaram NP.

### Skills

Skills comuns são transformadas em efeitos na fila e aplicadas conforme o target:

- `self`
- `one_ally`
- `party`
- `except_self`
- `one_enemy`
- `all_enemies`

O motor também respeita condições como field, traits, attributes e chance de sucesso via `Clovis` + `buffSuccUp`.

### Noble Phantasm

NPs são empacotados como uma ação atômica (`NOBLE_PHANTASM_EXECUTE`). A sequência interna pode conter:

- efeitos antes do dano;
- dano;
- efeitos depois do dano;
- escalonamento por NP level;
- escalonamento por overcharge;
- consumo da barra de NP;
- refund por alvo.

O dano usa uma fotografia dos buffs do atacante no momento correto para evitar mutações indevidas durante o processamento de hits.

## Fórmulas e tabelas

As fórmulas ficam em `Mechanics/`.

- `damageFormula.ts`: calcula dano de NP, HP final, dano por hit e array de overkill.
- `npRefundFormula.ts`: calcula refund de NP por hit usando NP rate, card type, classe do inimigo, overkill e buffs de NP gain/card performance.
- `Tables/classAdvantage.ts`: vantagem de classe, modificador de dano por classe e modificador de NP gain por classe.
- `Tables/attributeAdvantage.ts`: vantagem entre atributos `Man`, `Earth`, `Sky`, `Star` e `Beast`.
- `Tables/cardTables.ts`: modificadores de dano e NP gain por carta `Quick`, `Arts` e `Buster`.

O cálculo de dano considera ATK, multiplicador de NP, tipo de carta, classe, atributo, buffs/debuffs, bônus de NP damage, bônus especiais e dano fixo.

## Banco de dados local

Os dados ficam em `DataBase/`.

- `DBServants.json`: base de servants. Atualmente contém 8 entradas.
- `DBEnemies.json`: base de inimigos. Atualmente contém 11 entradas.
- `DBNodes.json`: nodes de farm. Atualmente contém 3 entradas.
- `DBcomps.ts`: composições pré-definidas.
- `DBcraftessences.ts`: Craft Essences e seus efeitos.
- `DBEffects.ts`: catálogo/tipos de efeitos, targets, condições e metadados.
- `DBnp.ts`: tipos auxiliares para dano e super effective de NP.
- `DBtraits.ts`: lista tipada de traits.
- `Schemas/`: schemas JSON para servants, enemies e nodes.

### Formato geral de um servant

Os servants são consumidos pelo app com campos como:

- `id`
- `name`
- `className`
- `attribute`
- `traits`
- `baseAtk`
- `baseHP`
- `baseNpGen`
- `personalSkills`
- `classSkills`
- `noblePhantasm`

### Formato geral de um node

Um node contém:

- `id`
- `name`
- `waves`

Cada wave contém:

- `waveNumber`
- `fields`
- `enemies`

Cada inimigo da wave aponta para um inimigo base ou servant e define `customClass` e `customHp`.

## Estrutura de pastas

```text
.
├── App.tsx
├── AppNavigator.tsx
├── TeamSetupScreen.tsx
├── PlayerCommandsScreen.tsx
├── QueueContext.tsx
├── AppEmSI/
│   ├── BattleOrganizer.ts
│   ├── EffectProcessor.ts
│   ├── InteractorFilter.ts
│   ├── NodeSetup.tsx
│   └── PartySetup.tsx
├── DataBase/
│   ├── DBServants.json
│   ├── DBEnemies.json
│   ├── DBNodes.json
│   ├── DBcomps.ts
│   ├── DBcraftessences.ts
│   ├── DBEffects.ts
│   ├── DBnp.ts
│   ├── DBtraits.ts
│   └── Schemas/
├── Mechanics/
│   ├── damageFormula.ts
│   ├── npRefundFormula.ts
│   └── Tables/
├── assets/
├── app.json
├── package.json
└── tsconfig.json
```

## Estado atual e limitações

- A base de dados é local e manual.
- Ainda não há integração com API Atlas.
- O app não possui suíte de testes automatizados no momento.
- O motor imprime muitos logs de depuração no console.
- Alguns textos/comentários do código aparecem com encoding quebrado, mas o comportamento principal foi preservado.
- `Master Skills` aparece na UI, mas ainda não há fluxo completo documentado/implementado para comandos de Mystic Code.

## Desenvolvimento

Antes de alterar dependências ou APIs do Expo, consulte a documentação versionada do SDK usado pelo projeto:

https://docs.expo.dev/versions/v56.0.0/

Arquivos gerados e dependências locais devem ficar fora do Git. O `.gitignore` já ignora `node_modules/`, `.expo/`, caches, builds e diretórios nativos gerados por prebuild (`android/` e `ios/`).
