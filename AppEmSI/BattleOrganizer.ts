import { ActiveServant, PartySlots } from './PartySetup';
import { ActiveNodeState } from './NodeSetup';
import { EffectQueueItem } from '../QueueContext';
import { processDamageInteraction } from './InteractorFilter'; 
import { calculateNpRefund } from '../Mechanics/npRefundFormula';

interface OrganizerResult {
  updatedParty: (ActiveServant | null)[];
  updatedNode: ActiveNodeState;
  battleLog: string[];
  isFinished: boolean;
  isFailed: boolean;
servantsQueUsaramNP?: string[]; // 🌟 ADICIONE ESTA LINHA AQUI
}

function printRamDump(
  party: (ActiveServant | null)[], 
  node: ActiveNodeState, 
  stepNum: number, 
  totalSteps: number, 
  currentActionName: string,
  battleLog: string[] 
) {
  console.log(`\n\n##################################################################################################`);
  console.log(`📊 DUMP CIRÚRGICO DA RAM - PASSO DO SIMULADOR [${stepNum}/${totalSteps}] | COMANDO: [${currentActionName}]`);
  console.log(`##################################################################################################`);

  console.log(`⚔️ FICHAS DA EQUIPE (PARTY COMPLETA):`);
  for (let i = 0; i < 6; i++) {
    const servo = party[i] as any;
    const isFront = i < 3;
    const slotLabel = `[Slot ${i + 1} - ${isFront ? `Front ${i + 1}` : `Back ${i - 2}`}]`;

    if (!servo) {
      console.log(`${slotLabel}: null`);
      continue;
    }

    const npCap = servo.maxNpGauge ?? 100;
    console.log(`${slotLabel} ${servo.baseData?.name || 'Servo Desconhecido'}`);
    console.log(`  • ATK: ${servo.currentAtk ?? 0} | HP: ${servo.currentHp ?? 0} / ${servo.maxHp ?? 0}`);
    console.log(`  • NPGauge: ${servo.currentNpGauge ?? 0}% / ${npCap}%`);
    console.log(`  • Buffs Ativos na RAM:`);
    if (!servo.activeBuffs || servo.activeBuffs.length === 0) {
      console.log(`    └─ null`);
    } else {
      servo.activeBuffs.forEach((b: any) => {
        console.log(`    └─ type: ${b.type} | valor: +${b.value}%`);
      });
    }
  }

  console.log(`--------------------------------------------------------------------------------------------------\n`);
  console.log(`👾 FICHAS DOS INIMIGOS (CURRENT WAVE):`);
  const nodeAny = node as any;
  if (nodeAny.activeWave?.enemies) {
    nodeAny.activeWave.enemies.forEach((enemy: any, idx: number) => {
      console.log(`• Inimigo ${idx + 1}: ${enemy.baseData?.name || 'Desconhecido'} | HP: ${enemy.currentHp ?? 0}`);
    });
  }

  console.log(`==================================================================================================`);
  console.log(`📜 HISTÓRICO NARRATIVO DO PASSO PRODUTO DO MOTOR`);
  console.log(`==================================================================================================`);
  if (!battleLog || battleLog.length === 0) {
    console.log(`  ⚠️ (Nenhum evento registrado)`);
  } else {
    battleLog.forEach((linha) => console.log(`  ${linha}`));
  }
  console.log(`##################################################################################################\n\n`);
}


export function executeTurnOrganizerStep(
  currentParty: (ActiveServant | null)[],
  currentNode: ActiveNodeState,
  effectsQueue: EffectQueueItem[],
  stepIndex: number
): OrganizerResult {
  
  const log: string[] = [];
  const partyBattle = JSON.parse(JSON.stringify(currentParty)) as (ActiveServant | null)[];
  const nodeBattle = JSON.parse(JSON.stringify(currentNode)) as ActiveNodeState;
  const npsUsadosNestePasso: string[] = []; // 🌟 ADICIONE ESTA LINHA AQUI

  if (effectsQueue.length === 0 || stepIndex >= effectsQueue.length) {
    return { updatedParty: partyBattle, updatedNode: nodeBattle, battleLog: [], isFinished: true, isFailed: false };
  }

  const effect = effectsQueue[stepIndex];
  const actionLabel = `${effect.type.toUpperCase()} (Origem: Slot ${effect.sourceSlot + 1})`;

  // ==============================================================================================
  // 👑 MOTOR ATÔMICO CENTRALIZADO DE NOBLE PHANTASM
  // ==============================================================================================
  if (effect.type === 'NOBLE_PHANTASM_EXECUTE') {
    const atacante = partyBattle[effect.sourceSlot];
    if (!atacante) {
      log.push(`❌ [FALHA] Atacante no slot ${effect.sourceSlot} não encontrado.`);
      return { updatedParty: currentParty, updatedNode: currentNode, battleLog: log, isFinished: false, isFailed: true };
    }

    const barraAtual = atacante.currentNpGauge ?? 0;
    if (barraAtual < 100) {
      log.push(`❌ [FALHA DE COMANDO] ${atacante.baseData?.name} não possui carga suficiente de NP (${barraAtual}%).`);
      return { updatedParty: currentParty, updatedNode: currentNode, battleLog: log, isFinished: false, isFailed: true };
    }

    // --- 1. CÁLCULO E CONSUMO DO OVERCHARGE ---
    if (atacante.oc === undefined) atacante.oc = 1;
    const ocAnterior = atacante.oc;

    if (barraAtual >= 200 && barraAtual < 300) {
      atacante.oc += 1;
      log.push(`🔋 [OVERCHARGE UP] Barra em ${barraAtual}% detectada! OC escalado: ${ocAnterior} ➡️ ${atacante.oc}`);
    } else if (barraAtual === 300) {
      atacante.oc += 2;
      log.push(`🔋 [OVERCHARGE UP] Barra máxima em 300% detectada! OC escalado: ${ocAnterior} ➡️ ${atacante.oc}`);
    } else {
      log.push(`🔋 [OVERCHARGE BASE] Barra em ${barraAtual}% detectada. Mantendo OC base nível ${atacante.oc}.`);
    }

    atacante.oc = Math.min(5, atacante.oc);
    atacante.currentNpGauge = 0; 
    log.push(`⚡ [DISPARO NP] ${atacante.baseData?.name} descarregou sua barra de NP para 0%!`);
    
    // 🌟 ADICIONE ESTA LINHA LOGO ABAIXO DO LOG DO DISPARO:
    if (atacante.baseData?.name) {
      npsUsadosNestePasso.push(atacante.baseData.name);
    }

    const ocIndex = atacante.oc - 1;

    const estaticizarEfeitosPorOC = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      
      if (obj.scalingType === 'oc' && Array.isArray(obj.values)) {
        const valorCalculado = obj.values[ocIndex] !== undefined 
          ? obj.values[ocIndex] 
          : obj.values[obj.values.length - 1] ?? 0;
        
        obj.value = valorCalculado;
      }
      
      if (Array.isArray(obj)) {
        obj.forEach(item => estaticizarEfeitosPorOC(item));
      } else {
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            estaticizarEfeitosPorOC(obj[key]);
          }
        }
      }
    };

    if (atacante.baseData?.noblePhantasm) {
      estaticizarEfeitosPorOC(atacante.baseData.noblePhantasm);
    }

    // --- 3. PROCESSAMENTO SEQUENCIAL DA ESTEIRA INTERNA DO NP ---
    const sequenciaEfeitos = (effect as any).npSequence || [];
    estaticizarEfeitosPorOC(sequenciaEfeitos);

    const baseAttackerBuffsSnapshot = JSON.parse(JSON.stringify(atacante.activeBuffs || []));

    sequenciaEfeitos.forEach((subEffect: any) => {
      
      // CASO A: É um efeito de modificador (Buff / Carga de Bateria / Heal)
      if (subEffect.category !== 'Damage') {
        let targetsList: any[] = [];
        switch (subEffect.target) {
          case 'self': if (atacante) targetsList.push(atacante); break;
          case 'one_ally': if (subEffect.targetSlot !== undefined && partyBattle[subEffect.targetSlot]) targetsList.push(partyBattle[subEffect.targetSlot]); break;
          case 'party': partyBattle.forEach(s => { if (s) targetsList.push(s); }); break;
          case 'one_enemy': if (subEffect.targetSlot !== undefined && nodeBattle.activeWave.enemies[subEffect.targetSlot]) targetsList.push(nodeBattle.activeWave.enemies[subEffect.targetSlot]); break;
          case 'all_enemies': nodeBattle.activeWave.enemies.forEach(e => { if (e && e.currentHp > 0) targetsList.push(e); }); break;
        }

        if (subEffect.applyCondition) {
          const cond = subEffect.applyCondition;
          if (cond.hasTraits) targetsList = targetsList.filter(t => (t.baseData?.traits || []).includes(cond.hasTraits));
          if (cond.hasAttributes) targetsList = targetsList.filter(t => String(t.baseData?.attribute).toLowerCase() === String(cond.hasAttributes).toLowerCase());
        }

        const finalVal = subEffect.value || 0;
        if (subEffect.type === 'npCharge') {
          targetsList.forEach(t => { t.currentNpGauge = Math.min(t.maxNpGauge || 100, (t.currentNpGauge || 0) + finalVal); log.push(`🔋 [BATERIA NP] ${t.baseData?.name} recebeu +${finalVal}% NP.`); });
        } else if (subEffect.type === 'heal') {
          targetsList.forEach(t => { t.currentHp = Math.min(t.maxHp, (t.currentHp || 0) + finalVal); log.push(`💚 [HEAL NP] ${t.baseData?.name} curou +${finalVal} HP.`); });
        } else {
          targetsList.forEach(t => {
            if (!t.activeBuffs) t.activeBuffs = [];
            t.activeBuffs.push({
              id: Date.now().toString() + Math.random().toString().substring(2, 6),
              type: subEffect.type,
              value: finalVal,
              durationTurns: subEffect.durationTurns ?? 1,
              durationAttacks: subEffect.durationAttacks ?? null
            });
            log.push(`✨ [NP EFFECT RAM] Gravado [${subEffect.type}] em ${t.baseData?.name} (+${finalVal}%).`);
          });
        }
      }

      // CASO B: É o momento do impacto bruto do Dano!
      if (subEffect.category === 'Damage') {
        if (nodeBattle.activeWave.enemies.every(e => e.currentHp <= 0)) return;

        let categoriaDeDanoReal = subEffect.DamageCategory;
        if (!categoriaDeDanoReal && atacante.baseData?.noblePhantasm?.DamageCategory) {
          categoriaDeDanoReal = atacante.baseData.noblePhantasm.DamageCategory;
        }

        if (categoriaDeDanoReal && Array.isArray(categoriaDeDanoReal)) {
          log.push(`⚔️ [DAMAGE ENGINE] Iniciando processamento de dano para ${atacante.baseData?.name}...`);
          
          categoriaDeDanoReal.forEach((dmgPaper: any) => {
            const powerData = dmgPaper.power || {};
            const finalCardType = dmgPaper.cardType || subEffect.cardType || 'Buster';
            let vermelhoTargetsList: any[] = [];
            
            if (powerData.target === 'all_enemies') {
              nodeBattle.activeWave.enemies.forEach(e => { if (e && e.currentHp > 0) vermelhoTargetsList.push(e); });
            } else {
              const targetIndex = subEffect.targetSlot !== undefined ? subEffect.targetSlot : -1;
              const inimigoAlvo = nodeBattle.activeWave.enemies[targetIndex];
              if (inimigoAlvo && inimigoAlvo.currentHp > 0) vermelhoTargetsList.push(inimigoAlvo);
            }

            log.push(`🎯 [MIRA VERMELHA] Alvos identificados para o impacto: ${vermelhoTargetsList.length}.`);

            vermelhoTargetsList.forEach((inimigo) => {
              const originalIndex = nodeBattle.activeWave.enemies.findIndex(e => e === inimigo);
              const multiplicadorDefinitivo = subEffect.npMultiplier || powerData.damageValue || 0;

              // 🔍 RESOLUÇÃO DA TRAVESSIA DE HITS (Priorizando a folha interna 'power' do DB)
              const resolvedHitCount = 
                powerData.hitCount || 
                dmgPaper.hitCount || 
                subEffect.hitCount || 
                atacante.baseData?.noblePhantasm?.hitCount || 
                1;

              const resolvedHitDistribution = 
                powerData.hitDistribution || 
                dmgPaper.hitDistribution || 
                subEffect.hitDistribution || 
                atacante.baseData?.noblePhantasm?.hitDistribution || 
                [100];

              const dadosBrutosParaFiltro = {
                attackerAtk: atacante.currentAtk ?? 10000,
                attackerClass: atacante.baseData?.className,
                attackerAttribute: atacante.baseData?.attribute,
                attackerTraits: atacante.baseData?.traits || [], 
                activeBuffsAtacante: JSON.parse(JSON.stringify(baseAttackerBuffsSnapshot)), 
                defenderClass: inimigo.currentClass || inimigo.baseData?.className,
                defenderAttribute: inimigo.baseData?.attribute,
                defenderTraits: inimigo.baseData?.traits || [], 
                activeBuffsDefensor: inimigo.activeBuffs || [], 
                enemyTargetCondition: dmgPaper.enemyTargetCondition ?? null,
                npMultiplier: multiplicadorDefinitivo, 
                cardType: finalCardType,
                superEffective: dmgPaper.superEffective || subEffect.superEffective || null,
                hitCount: resolvedHitCount, // Sincronizado com a árvore correta do DB
                hitDistribution: resolvedHitDistribution, // Sincronizado com a árvore correta do DB
                scalingType: powerData.scalingType || 'normal',
                currentHp: inimigo.currentHp
              };

              const resultadoInteracao = processDamageInteraction(dadosBrutosParaFiltro);
              const { 
                damageResult, 
                updatedAttackerBuffs, 
                updatedDefenderBuffs, 
                cardModConsolidado, 
                npGainModConsolidado,
                pendingAfterDamageEffects 
              } = resultadoInteracao as any;

              atacante.activeBuffs = updatedAttackerBuffs;
              inimigo.activeBuffs = updatedDefenderBuffs;

              // 1. Modifica o HP do alvo primeiro
              const hpAnterior = inimigo.currentHp;
              inimigo.currentHp = damageResult.finalEnemyHp;
              if (originalIndex !== -1) nodeBattle.activeWave.enemies[originalIndex].currentHp = damageResult.finalEnemyHp;
              
              // 2. Calcula e aplica o Refund usando exatamente a mesma distribuição resolvida
              const refundGerado = calculateNpRefund({
                attackerNpRate: atacante.baseData?.baseNpGen || 0.5,
                defenderClass: inimigo.currentClass || inimigo.baseData?.className,
                cardType: finalCardType as any,
                hitDistribution: resolvedHitDistribution, // 👈 CORRIGIDO: Vinculado com a constante unificada
                overkillArray: damageResult.overkillArray || [], 
                cardMod: cardModConsolidado,      
                npGainMod: npGainModConsolidado   
              });

              const npCap = atacante.maxNpGauge ?? 100;
              atacante.currentNpGauge = Math.min(npCap, (atacante.currentNpGauge || 0) + refundGerado);

              log.push(`   ├── 🔋 [RECOVERY ENGINE] Refund por Alvo: +${refundGerado.toFixed(2)}% NP.`);
              log.push(`   └── 💥 [HIT DAMAGE] Dano Realizado: 🔥 ${damageResult.totalDamage.toLocaleString('pt-BR')} 🔥 (Hits: ${resolvedHitCount})`);
              log.push(`       HP Alvo: ${hpAnterior.toLocaleString('pt-BR')} ➡️ ${inimigo.currentHp.toLocaleString('pt-BR')}`);

              // 3. Esteira de gatilhos pós-dano
              if (Array.isArray(pendingAfterDamageEffects) && pendingAfterDamageEffects.length > 0) {
                pendingAfterDamageEffects.forEach((eff: any) => {
                  if (eff.type === 'npCharge') {
                    atacante.currentNpGauge = Math.min(npCap, (atacante.currentNpGauge || 0) + eff.value);
                    log.push(`   └── 🔋 [BUFF_ON_ATTACK] Gatilho Pós-Dano ativado: +${eff.value}% NP adicionado a ${atacante.baseData?.name}.`);
                  } 
                  else if (eff.type === 'heal') {
                    atacante.currentHp = Math.min(atacante.maxHp, (atacante.currentHp || 0) + eff.value);
                    log.push(`   └── 💚 [BUFF_ON_ATTACK] Gatilho Pós-Dano ativado: Cura de +${eff.value} HP aplicada a ${atacante.baseData?.name}.`);
                  }
                });
              }
            });
          });
        }
      }
    });

    const todosInimigosZerados = nodeBattle.activeWave.enemies.every(enemy => !enemy || enemy.currentHp <= 0);
    if (todosInimigosZerados) log.push(`🏁 🛑 [JUIZ DE TIMELINE] Todos os inimigos foram eliminados.`);

    const isLastStep = (stepIndex + 1) >= effectsQueue.length;
    log.push(isLastStep ? `🏁 [JUIZ DE TIMELINE] Todos os comandos processados.` : `🏁 Mover fluxo para o próximo comando.`);
    
    printRamDump(partyBattle, nodeBattle, stepIndex + 1, effectsQueue.length, actionLabel, log);
    return { updatedParty: partyBattle, updatedNode: nodeBattle, battleLog: log, isFinished: isLastStep, isFailed: false, servantsQueUsaramNP: npsUsadosNestePasso };
  }

  // ==============================================================================================
  // 🔵 LEITOR GERAL DE PAPEL AZUL (MECÂNICA DE SKILLS NORMAIS RESTAURADA)
  // ==============================================================================================
  let finalEffectValue = effect.value ?? 0;
  const currentTarget = effect.target;
  let targetsList: any[] = [];

  switch (currentTarget) {
    case 'self':
      if (partyBattle[effect.sourceSlot]) targetsList.push(partyBattle[effect.sourceSlot]);
      break;
    case 'one_ally':
      if (effect.targetSlot !== undefined && partyBattle[effect.targetSlot]) targetsList.push(partyBattle[effect.targetSlot]);
      break;
    case 'party':
      for (let i = 0; i < 3; i++) {
        if (partyBattle[i]) targetsList.push(partyBattle[i]);
      }
      break;
    case 'except_self':
      for (let i = 0; i < 3; i++) {
        if (partyBattle[i] && i !== effect.sourceSlot) targetsList.push(partyBattle[i]);
      }
      break;
    case 'one_enemy':
      if (effect.targetSlot !== undefined && nodeBattle.activeWave.enemies[effect.targetSlot]) {
        targetsList.push(nodeBattle.activeWave.enemies[effect.targetSlot]);
      }
      break;
    case 'all_enemies':
      nodeBattle.activeWave.enemies.forEach((enemy) => {
        if (enemy && enemy.currentHp > 0) targetsList.push(enemy);
      });
      break;
    default:
      console.log(`⚠️ Target desconhecido: ${currentTarget}`);
      break;
  }

  const effectAny = effect as any;
  if (effectAny.Clovis) {
    const clovisBaseChance = Number(effectAny.Clovis.value ?? 0);
    log.push(`👑 [AUDITOR CLOVIS] Verificando probabilidade para o efeito [${effect.type}]. Chance Base: ${clovisBaseChance}%`);

    const approvedTargets: any[] = [];
    for (const target of targetsList) {
      let totalBuffSuccUp = 0;
      
      if (target && Array.isArray(target.activeBuffs)) {
        target.activeBuffs
          .filter((b: any) => b.type === 'buffSuccUp')
          .forEach((b: any) => { totalBuffSuccUp += Number(b.value ?? 0); });
      }

      const totalChance = clovisBaseChance + totalBuffSuccUp;
      log.push(`   └─ Alvo: ${target.baseData?.name || 'Alvo'} | Suporte: +${totalBuffSuccUp}% ➡️ Total: ${totalChance}%`);

      if (totalChance < 100) {
        log.push(`   ❌ [CLOVIS NEGADO] ${target.baseData?.name} ficou abaixo dos 100% necessários (${totalChance}%). Próximo alvo...`);
      } else {
        log.push(`   ✅ [CLOVIS SUCESSO] ${target.baseData?.name} validado com ${totalChance}% de chance.`);
        approvedTargets.push(target);
      }
    }
    targetsList = approvedTargets;
  }

  if (effectAny.applyCondition) {
    const cond = effectAny.applyCondition;

    if (cond.fieldCondition) {
      const fieldsAtuais = nodeBattle.activeWave?.activeFields || [];
      if (!fieldsAtuais.includes(cond.fieldCondition)) {
        log.push(`❌ [CONDITION FIELD] Campo exigido [${cond.fieldCondition}] ausente. Cancelando bloco.`);
        targetsList = [];
      }
    }

    if (cond.hasTraits && targetsList.length > 0) {
      const traitsExigidas: string[] = Array.isArray(cond.hasTraits) 
        ? cond.hasTraits.map((t: string) => String(t).toLowerCase().trim())
        : [String(cond.hasTraits).toLowerCase().trim()];

      log.push(`🧬 [FILTRO TRAIT] Alvos sob análise devem conter alguma destas Traits: [${traitsExigidas.join(', ')}]`);
      
      targetsList = targetsList.filter((t) => {
        const traitsDoAlvo: string[] = Array.isArray(t.baseData?.traits) 
          ? t.baseData.traits.map((trait: string) => String(trait).toLowerCase().trim())
          : [];

        const possuiTraitExigida = traitsExigidas.some((traitExigida) => traitsDoAlvo.includes(traitExigida));

        if (!possuiTraitExigida) {
          log.push(`   ❌ [TRAIT IGNORADO] ${t.baseData?.name || 'Alvo'} não possui as traits necessárias.`);
        } else {
          log.push(`   ✅ [TRAIT MATCH] ${t.baseData?.name || 'Alvo'} validado com sucesso.`);
        }
        
        return possuiTraitExigida;
      });
    }

    if (cond.hasAttributes && targetsList.length > 0) {
      const attrProcurado = String(cond.hasAttributes).toLowerCase().trim();
      targetsList = targetsList.filter((t) => 
        String(t.baseData?.attribute || '').toLowerCase().trim() === attrProcurado
      );
    }
  }

  const exceptionsNotStorable = ['npCharge', 'heal', 'noblePhantasm'];

  if (effect.type === 'npCharge') {
    targetsList.forEach((target) => {
      const cap = target.maxNpGauge ?? 100;
      target.currentNpGauge = Math.min(cap, (target.currentNpGauge || 0) + finalEffectValue);
      log.push(`🔋 [BATERIA IMMEDIATE] ${target.baseData?.name} carregou +${finalEffectValue}% de NP.`);
    });
  } 
  else if (effect.type === 'heal') {
    targetsList.forEach((target) => {
      target.currentHp = Math.min(target.maxHp, (target.currentHp || 0) + finalEffectValue);
      log.push(`💚 [HEAL IMMEDIATE] ${target.baseData?.name} curou +${finalEffectValue} HP.`);
    });
  } 
  else if (!exceptionsNotStorable.includes(effect.type)) {
    targetsList.forEach((target) => {
      if (!target.activeBuffs) target.activeBuffs = [];

      const pacoteBuff: any = {
        id: Date.now().toString() + Math.random().toString().substring(2, 6),
        type: effect.type, 
        value: effect.type === 'buffOnAttack' ? 0 : finalEffectValue, 
        durationTurns: effect.durationTurns ?? null,
        durationAttacks: effectAny.durationAttacks ?? null,
        metaString: effectAny.metaString ?? null
      };

      if (effect.type === 'buffOnAttack' && effectAny.subEffects) {
        pacoteBuff.subEffects = JSON.parse(JSON.stringify(effectAny.subEffects));
      }

      target.activeBuffs.push(pacoteBuff);
      log.push(`✨ [ACTIVE BUFF RAM] Gravado [${effect.type}] em ${target.baseData?.name}.`);
    });
  }

  const isLastStep = (stepIndex + 1) >= effectsQueue.length;
  if (isLastStep) {
    log.push(`🏁 [JUIZ DE TIMELINE] Todos os comandos processados. Encerrando turno.`);
  }

  printRamDump(partyBattle, nodeBattle, stepIndex + 1, effectsQueue.length, actionLabel, log);
  return {
    updatedParty: partyBattle,
    updatedNode: nodeBattle,
    battleLog: log,
    isFinished: isLastStep,
    isFailed: false
  };
}
export function advancePartyTurnState(currentParty: (ActiveServant | null)[]): any {
  const updatedParty = currentParty.map((slot) => {
    if (!slot) return null;

    // 1. Reduz o currentCooldown das Personal Skills sem cair em números negativos
    let updatedSkills = slot.baseData?.personalSkills;
    if (updatedSkills && Array.isArray(updatedSkills)) {
      updatedSkills = updatedSkills.map((skill: any) => ({
        ...skill,
        currentCooldown: Math.max(0, (skill.currentCooldown || 0) - 1),
      }));
    }

    // 2. Atualiza e filtra os Buffs Ativos
    let updatedBuffs = slot.activeBuffs || [];
    if (Array.isArray(updatedBuffs)) {
      updatedBuffs = updatedBuffs
        .map((buff: any) => {
          if (buff.durationTurns === undefined || buff.durationTurns === null) {
            return buff;
          }
          return {
            ...buff,
            durationTurns: buff.durationTurns - 1,
          };
        })
        .filter((buff: any) => buff.durationTurns === undefined || buff.durationTurns === null || buff.durationTurns > 0);
    }

    return {
      ...slot,
      activeBuffs: updatedBuffs,
      baseData: slot.baseData
        ? {
            ...slot.baseData,
            personalSkills: updatedSkills,
          }
        : slot.baseData,
    };
  });

  return updatedParty;
}