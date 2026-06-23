// =========================================================================
// 🔋 MOTOR MATEMÁTICO DE RECOVERY: NP REFUND FORMULA (TOTALMENTE LOGADO)
// =========================================================================

import { ServantClass, getClassNpGenModifier } from './Tables/classAdvantage';
import { Card, CARD_NP_TABLE } from './Tables/cardTables';

export interface NpRefundInput {
  attackerNpRate: number;        // baseNpGen do atacante (ex: 0.86)
  defenderClass: ServantClass;   // Usado para pescar o enemyClassNpGenMod
  cardType: Card;                // Usado para pescar o cardNPValue da tabela
  hitDistribution: number[];    // Distribuição de hits (quantidade de repetições do loop)
  overkillArray: (0 | 1)[];      // Array gerado pela damageFormula para este inimigo específico
  
  // Modificadores acumulados na RAM
  cardMod: number;               // CardMod (soma de buffs de performance da cor da carta)
  npGainMod: number;             // npGenMod (soma de todos os npGenUp do atacante)
}

export function calculateNpRefund(input: NpRefundInput): number {
  const { 
    attackerNpRate, 
    defenderClass, 
    cardType, 
    hitDistribution, 
    overkillArray, 
    cardMod, 
    npGainMod 
  } = input;

  // 1. Coleta os valores nas tabelas estruturadas do seu projeto
  const cardNPValue = CARD_NP_TABLE[cardType] || 0.0;
  const enemyClassNpGenMod = getClassNpGenModifier(defenderClass);

  console.log(`\n  ┌──────────────────────────────────────────────────────────────────────────┐`);
  console.log(`  │ 🧪 [DEBUG INICIAL: DADOS BRUTOS DA ENTRADA DE NP REFUND]                 │`);
  console.log(`  ├──────────────────────────────────────────────────────────────────────────┤`);
  console.log(`  │ 🔸 [Atacante] baseNpGen (attackerNpRate): ${attackerNpRate.toFixed(4)}`);
  console.log(`  │ 🔸 [Carta] Tipo: ${cardType.padEnd(8)} | cardNPValue Base: ${cardNPValue.toFixed(2)}`);
  console.log(`  │ 🔸 [Inimigo] Classe: ${defenderClass.padEnd(8)} | enemyClassNpGenMod: ${enemyClassNpGenMod.toFixed(2)}`);
  console.log(`  │ 🔸 [Buffs RAM] CardMod: ${(cardMod * 100).toFixed(2)}% (+${cardMod.toFixed(4)})`);
  console.log(`  │ 🔸 [Buffs RAM] npGenMod: ${(npGainMod * 100).toFixed(2)}% (+${npGainMod.toFixed(4)})`);
  console.log(`  │ 🔸 [Hits Total]: ${hitDistribution.length} hits cadastrados`);
  console.log(`  │ 🔸 [Overkill Array]: [ ${overkillArray.join(', ')} ]`);
  console.log(`  └──────────────────────────────────────────────────────────────────────────┘`);

  // 2. Prepara os blocos estáticos calculados para expor a matemática limpa no log
  const termoCardCompleto = cardNPValue * (1 + cardMod);
  const termoNpGenCompleto = 1 + npGainMod;

  console.log(`     ├── 🧮 [EQUAÇÃO PARCIAL CONSTRUIDA (Sem Overkill)]`);
  console.log(`     │    Formula: baseNpGen * (cardNPValue * (1 + CardMod)) * enemyClassNpGenMod * (1 + npGenMod)`);
  console.log(`     │    Substituindo: ${attackerNpRate} * (${cardNPValue} * (1 + ${cardMod})) * ${enemyClassNpGenMod} * (1 + ${npGainMod})`);
  console.log(`     │    Resultando em: ${attackerNpRate} * ${termoCardCompleto.toFixed(4)} * ${enemyClassNpGenMod} * ${termoNpGenCompleto.toFixed(4)}`);
  console.log(`     │    Ganho por hit normal (1.0x): ${(attackerNpRate * termoCardCompleto * enemyClassNpGenMod * termoNpGenCompleto).toFixed(4)}%`);
  console.log(`     │    Ganho por hit overkill (1.5x): ${(attackerNpRate * termoCardCompleto * enemyClassNpGenMod * termoNpGenCompleto * 1.5).toFixed(4)}%\n`);

  let npRefundTotalInimigo = 0;

  console.log(`     ├── 🔄 [INICIANDO ITERAÇÃO DOS HITS PARA ESTE ALVO]`);

  // 3. Loop por hit destrinchando o OverkillMod de cada posição do array
  for (let i = 0; i < hitDistribution.length; i++) {
    const overkillStatus = overkillArray[i];
    const overkillMod = overkillStatus === 1 ? 1.5 : 1.0;

    // ⚔️ CÁLCULO DA FÓRMULA OFICIAL
    const npHitGain = attackerNpRate * termoCardCompleto * enemyClassNpGenMod * termoNpGenCompleto * overkillMod;
    
    // Acumulador temporário para rastreamento visual
    const subtotalAntes = npRefundTotalInimigo;
    npRefundTotalInimigo += npHitGain;

    console.log(`     │    ├── 🎯 HIT #${i + 1} de ${hitDistribution.length}`);
    console.log(`     │    │    ├── Estado: [Status no Array: ${overkillStatus}] -> Modificador Aplicado: ${overkillMod === 1.5 ? '💀 OVERKILL (1.5x)' : '⚔️ NORMAL (1.0x)'}`);
    console.log(`     │    │    ├── Cálculo Exato: ${attackerNpRate} * ${termoCardCompleto.toFixed(4)} * ${enemyClassNpGenMod} * ${termoNpGenCompleto.toFixed(4)} * ${overkillMod}`);
    console.log(`     │    │    └── Resultado do Hit: +${npHitGain.toFixed(4)}% | Subtotal Acumulado: ${subtotalAntes.toFixed(4)}% -> ${npRefundTotalInimigo.toFixed(4)}%`);
  }

  // Finalização do processamento do alvo
  const resultadoTruncadoFinal = Number(npRefundTotalInimigo.toFixed(2));

  console.log(`     │`);
  console.log(`     └── 🏁 [FIM DOS HITS DO ALVO]`);
  console.log(`          • Soma Bruta Acumulada: ${npRefundTotalInimigo.toFixed(4)}%`);
  console.log(`          • Valor Retornado (Arredondado 2 Casas): ${resultadoTruncadoFinal.toFixed(2)}%\n`);

  return resultadoTruncadoFinal;
}