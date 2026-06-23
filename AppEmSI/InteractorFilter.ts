import { calculateNpDamage, DamageFormulaInput, DamageFormulaResult } from "../Mechanics/damageFormula";

export interface InteractionResult {
  damageResult: DamageFormulaResult;
  updatedAttackerBuffs: any[];
  updatedDefenderBuffs: any[];
  cardModConsolidado: number;
  npGainModConsolidado: number;
  // 📦 Alinhado perfeitamente com a leitura do Organizer
  pendingAfterDamageEffects: { type: string; value: number }[];
}

export function processDamageInteraction(input: any): InteractionResult {
  console.log(`\n   ⚙️ [INTERACTION FILTER] Iniciando consolidação de dados de combate...`);

  let buffsAtacanteModificados = JSON.parse(JSON.stringify(input.activeBuffsAtacante || []));
  let buffsDefensorModificados = JSON.parse(JSON.stringify(input.activeBuffsDefensor || []));
  
  let pendingAfterDamageEffects: { type: string; value: number }[] = [];

  // ==============================================================================================
  // 💥 INTERCEPTADOR INTERNO: GATILHOS PRE-DANOS (before_damage) & PÓS-DANOS (after_damage)
  // ==============================================================================================
  const gatilhosAtivos = buffsAtacanteModificados.filter((b: any) => b.type === 'buffOnAttack');
  
  gatilhosAtivos.forEach((gatilho: any) => {
    const subEfeitos = Array.isArray(gatilho.subEffects) ? gatilho.subEffects : [];
    
    subEfeitos.forEach((sub: any) => {
      // Como o interactor processa 1 inimigo por vez, cada execução representa 1 hit individual
      const valorSubEfeito = sub.value ?? 0;

      if (sub.executionTiming === 'before_damage') {
        console.log(`      ⚔️ [INTERACTOR GATILHO] Pré-Dano temporário injetado: [${sub.type}] (+${valorSubEfeito})`);
        // Injeta com a flag 'isTemporaryGatilho' para ser devidamente limpo após o cálculo do dano
        buffsAtacanteModificados.push({
          type: sub.type,
          value: valorSubEfeito,
          isTemporaryGatilho: true
        });
      }

      if (sub.executionTiming === 'after_damage') {
        // Guarda na esteira de retorno para o BattleOrganizer executar no final definitivo do hit
        pendingAfterDamageEffects.push({
          type: sub.type,
          value: valorSubEfeito
        });
      }
    });

    // Reduz as cargas de uso do buff passivo de ataque (durationAttacks) se aplicável
    if (gatilho.durationAttacks !== null && gatilho.durationAttacks > 0) {
      gatilho.durationAttacks -= 1;
      console.log(`      📉 [GATILHO COOLDOWN] BuffOnAttack consumiu 1 carga. Restam: ${gatilho.durationAttacks}`);
    }
  });

  // Remove os gatilhos esgotados da lista que será devolvida à RAM do Servo
  buffsAtacanteModificados = buffsAtacanteModificados.filter(
    (b: any) => b.type !== 'buffOnAttack' || b.durationAttacks === null || b.durationAttacks > 0
  );

  // ==============================================================================================
  // 📊 CONSOLIDAÇÃO TRADICIONAL DE BUFFS (LEITURA DA FORMULA HISTÓRICA DO PROJETO)
  // ==============================================================================================
  const cardNP = input.cardType;
  let cardMod = 0, atkMod = 0, defMod = 0, powerMod = 0, npDamageMod = 0, dmgPlus = 0, npGainMod = 0;
  const buffPerformAlvo = cardNP === 'Buster' ? 'busterPerformUp' : (cardNP === 'Arts' ? 'artsPerformUp' : 'quickPerformUp');

  buffsAtacanteModificados.forEach((b: any) => {
    if (b.type === 'npGenUp' || b.type === 'npGainUp') npGainMod += (b.value / 100);
    if (b.type === 'atkUp') atkMod += (b.value / 100);
    if (b.type === 'atkDown') atkMod -= (b.value / 100);
    if (b.type === buffPerformAlvo) cardMod += (b.value / 100);
    if (b.type === 'npDmgUp' || b.type === 'npPowerUp') npDamageMod += (b.value / 100);
    if (b.type === 'specialDamageUp' || b.type === 'antiDmgUp') powerMod += (b.value / 100);
    if (b.type === 'damagePlus' || b.type === 'dmgAdd') dmgPlus += b.value;
  });

  // 🧹 LIMPEZA CRUCIAL: Retira os buffs do gatilho antes de devolver a lista ao Organizer!
  // Isto evita que o bónus de dano (Ex: AtkUp temporário) fique para sempre colado na RAM do servo.
  buffsAtacanteModificados = buffsAtacanteModificados.filter((b: any) => !b.isTemporaryGatilho);

  buffsDefensorModificados.forEach((b: any) => {
    if (b.type === 'defUp') defMod += (b.value / 100);
    if (b.type === 'defDown') defMod -= (b.value / 100);
    if (b.type === 'cardResDown' && b.cardType === cardNP) cardMod += (b.value / 100);
    if (b.type === 'cardResUp' && b.cardType === cardNP) cardMod -= (b.value / 100);
  });

  let superEffectiveModifier = 100;
  if (input.superEffective && input.superEffective.extraDamage) {
    const extraDmg = input.superEffective.extraDamage;
    const ocIndex = input.overchargeLevel !== undefined ? (input.overchargeLevel - 1) : 0;
    superEffectiveModifier = extraDmg.values && extraDmg.values[ocIndex] !== undefined ? extraDmg.values[ocIndex] : 150;
  }

  const formulaInput: DamageFormulaInput = {
    attackerClass: input.attackerClass,
    defenderClass: input.defenderClass,
    attackerAttribute: input.attackerAttribute,
    defenderAttribute: input.defenderAttribute,
    currentAtk: input.attackerAtk,
    cardType: input.cardType,
    damageValue: input.npMultiplier || 600, 
    superEffectiveModifier,
    hitCount: input.hitCount || 1,
    hitDistribution: input.hitDistribution || [100],
    currentHp: input.currentHp,
    cardMod, atkMod, defMod, powerMod, npDamageMod, dmgPlus
  };

  const formulaResult = calculateNpDamage(formulaInput);

  return {
    damageResult: formulaResult,
    updatedAttackerBuffs: buffsAtacanteModificados,
    updatedDefenderBuffs: buffsDefensorModificados,
    cardModConsolidado: cardMod,
    npGainModConsolidado: npGainMod,
    pendingAfterDamageEffects // 📦 Devolve perfeitamente embalado para o Organizer somar
  };
}