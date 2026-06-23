// 🌟 CORREÇÃO PREVENTIVA: Convertido para require com rotas e maiúsculas corrigidas para evitar novas travas de compilação
const ServantsImport = require("../DataBase/DBServants.json");
const ServantsData = ServantsImport as any;

import { PRE_MADE_COMPS_DB, PreMadeComp } from "../DataBase/DBcomps";
import { CraftEssenceBase, CRAFT_ESSENCES_DB } from "../DataBase/DBcraftessences";

interface JSONServant {
  id: string;
  name: string;
  baseAtk: number;
  baseHP: number;
  personalSkills: Array<{
    slot: 'S1' | 'S2' | 'S3';
    baseCooldown: number[]; // Array de 10 posições [lvl1, lvl2, ..., lvl10]
  }>;
  [key: string]: any;
}

// Interface para armazenar e mutar Buffs/Debuffs ativos no servo
export interface ActiveBuff {
  id: string;               // ID único para controle do motor de batalha
  type: string;             // Ex: 'atkUp', 'defDown', 'npGenUp', 'evade', etc.
  value?: number;           // Valor numérico do efeito (opcional)
  durationTurns?: number;   // Contador de turnos (mutável/alterável no fim da fila)
  durationAttacks?: number; // Contador de ataques (mutável/alterável ao disparar NP)
}

// Estrutura para rastrear os cooldowns individuais de cada skill
export interface SkillCooldownState {
  slot: 'S1' | 'S2' | 'S3';
  baseCooldown: number;
  currentCooldown: number;
}

// 1. Estrutura do Servo "VIVO" atualizada com o armazenador de buffs
export interface ActiveServant {
  baseData: any;      
  npLevel: number;        
  skillLevels: [number, number, number];
  equippedCE: CraftEssenceBase | null;
  currentHp: number;      
  maxHp: number;          
  currentAtk: number;
  currentNpGauge: number;  
  maxNpGauge: number;    
  oc: number;
  skillsCooldown: [SkillCooldownState, SkillCooldownState, SkillCooldownState];
  activeBuffs: ActiveBuff[];
}

export type PartySlots = [
  ActiveServant | null, ActiveServant | null, ActiveServant | null, // Front
  ActiveServant | null, ActiveServant | null, ActiveServant | null  // Back
];

export function getMaxNpGauge(npLevel: number): number {
  if (npLevel === 1) return 100;
  if (npLevel >= 2 && npLevel <= 4) return 200;
  if (npLevel === 5) return 300;
  return 100;
}

// Auxiliar para descobrir o cooldown base de uma skill baseada no nível dela (1-10)
function getSkillBaseCooldown(skillData: any, level: number): number {
  if (!skillData || !skillData.baseCooldown || !Array.isArray(skillData.baseCooldown)) return 5;

  const cd = skillData.baseCooldown;
  
  const targetIndex = Math.max(1, Math.min(level, 10)) - 1;
  return skillData.baseCooldown[targetIndex] ?? 5;
}

// 2. Transforma um Servo bruto + CE bruta em um "ActiveServant"
export function createActiveServant(servantId: string, ceId: string | null = null): ActiveServant | null {
  // 🌟 CORREÇÃO: Adicionada tipagem explícita (s: any) para blindar contra o require
  const servant = (ServantsData.servants || []).find((s: any) => s.id === servantId);
  if (!servant) return null;

  const ce = ceId ? CRAFT_ESSENCES_DB.find(c => c.id === ceId) : null;

  const servoHp = servant.baseHP || 10000;
  const servoAtk = servant.baseAtk || 10000;

  const ceHpBonus = ce ? (ce.ceHp || 0) : 0;
  const ceAtkBonus = ce ? (ce.ceAtk || 0) : 0;

  const hpFinal = servoHp + ceHpBonus;
  const atkFinal = servoAtk + ceAtkBonus;

  const npInicial = 1;
  const defaultLevels: [number, number, number] = [10, 10, 10];

  const s1Data = servant.personalSkills?.find((s: any) => s.slot === 'S1');
  const s2Data = servant.personalSkills?.find((s: any) => s.slot === 'S2');
  const s3Data = servant.personalSkills?.find((s: any) => s.slot === 'S3');

  return {
    baseData: servant,
    npLevel: npInicial,                
    skillLevels: defaultLevels,  
    equippedCE: ce || null, 
    currentHp: hpFinal,
    maxHp: hpFinal,
    currentAtk: atkFinal, 
    currentNpGauge: 0,          
    maxNpGauge: getMaxNpGauge(npInicial), 
    oc: 1,
    skillsCooldown: [
      { slot: 'S1', baseCooldown: getSkillBaseCooldown(s1Data, defaultLevels[0]), currentCooldown: 0 },
      { slot: 'S2', baseCooldown: getSkillBaseCooldown(s2Data, defaultLevels[1]), currentCooldown: 0 },
      { slot: 'S3', baseCooldown: getSkillBaseCooldown(s3Data, defaultLevels[2]), currentCooldown: 0 },
    ],
    activeBuffs: []
  };
}

export function triggerSkillCooldown(servo: ActiveServant, slot: 'S1' | 'S2' | 'S3'): ActiveServant {
  const updatedSkills = servo.skillsCooldown.map(sk => {
    if (sk.slot === slot) {
      return { ...sk, currentCooldown: sk.baseCooldown }; 
    }
    return sk;
  }) as [SkillCooldownState, SkillCooldownState, SkillCooldownState];

  return { ...servo, skillsCooldown: updatedSkills };
}

export function validatePartySelection(currentParty: PartySlots, targetSlotIndex: number, newServantId: string | null): boolean {
  if (!newServantId) return true;

  const candidateIds = currentParty.map((slot, idx) => {
    if (idx === targetSlotIndex) return newServantId;
    return slot ? slot.baseData.id : null;
  }).filter((id): id is string => id !== null);

  const counts: { [id: string]: number } = {};
  for (const id of candidateIds) {
    counts[id] = (counts[id] || 0) + 1;
  }

  let pairsCount = 0;
  for (const id in counts) {
    if (counts[id] >= 3) return false;
    if (counts[id] === 2) pairsCount++;
  }

  if (pairsCount > 1) return false;
  return true;
}

export function loadPartyFromComp(compId: string): PartySlots {
  const foundComp = PRE_MADE_COMPS_DB.find(c => c.id === compId);
  if (!foundComp) return [null, null, null, null, null, null];

  return [
    foundComp.frontlineServantIds[0] ? createActiveServant(foundComp.frontlineServantIds[0], foundComp.frontlineCeIds[0]) : null,
    foundComp.frontlineServantIds[1] ? createActiveServant(foundComp.frontlineServantIds[1], foundComp.frontlineCeIds[1]) : null,
    foundComp.frontlineServantIds[2] ? createActiveServant(foundComp.frontlineServantIds[2], foundComp.frontlineCeIds[2]) : null,
    
    foundComp.backlineServantIds[0] ? createActiveServant(foundComp.backlineServantIds[0], foundComp.backlineCeIds[0]) : null,
    foundComp.backlineServantIds[1] ? createActiveServant(foundComp.backlineServantIds[1], foundComp.backlineCeIds[1]) : null,
    foundComp.backlineServantIds[2] ? createActiveServant(foundComp.backlineServantIds[2], foundComp.backlineCeIds[2]) : null,
  ];
}

export interface ClonedPartyState {
  slots: PartySlots;
  snapshotLabel: string;
}

function resolveScalingEffects(effects: any[], level: number, scalingTypeToCheck: 'skillLevel' | 'npLevel') {
  if (!Array.isArray(effects)) return;

  effects.forEach((effect: any) => {
    // Se o efeito possui subEfeitos (Ex: buffOnAttack contendo recarga de NP), processa recursivamente
    if (effect.subEffects && Array.isArray(effect.subEffects)) {
      resolveScalingEffects(effect.subEffects, level, scalingTypeToCheck);
    }

    // 🎲 [CORREÇÃO] DETECÇÃO E REDUÇÃO DO SISTEMA DE CLOVIS DINÂMICA (Ajustado de .clovis para .Clovis com C maiúsculo)
    if (effect.Clovis && typeof effect.Clovis === 'object') {
      const ch = effect.Clovis;
      // Só processa se o tipo de escalonamento da clovis for compatível com a varredura atual
      if (ch.scalingType === scalingTypeToCheck && Array.isArray(ch.values)) {
        const targetIndex = Math.max(1, level) - 1;
        const computedClovisValue = ch.values[targetIndex] !== undefined
          ? ch.values[targetIndex]
          : ch.values[ch.values.length - 1] ?? 100;

        // Estaticiza a clovis fixando o 'value' absoluto e deletando a array de árvore
        ch.value = computedClovisValue;
        delete ch.values;
        console.log(`   🎲 [Clovis FIXADA] Efeito [${effect.type}] Clovis valendo o inteiro absoluto: ${computedClovisValue} para o Nível ${level}`);
      } else if (ch.scalingType === 'fixed' && ch.value !== undefined) {
        // Se for fixo, garante consistência mantendo o valor original
        ch.value = ch.value;
      }
    }

    // Verifica se o tipo de escalonamento do próprio efeito bate com o que estamos computando
    if (effect.scalingType === scalingTypeToCheck && Array.isArray(effect.values)) {
      const targetIndex = Math.max(1, level) - 1;
      
      const computedValue = effect.values[targetIndex] !== undefined 
        ? effect.values[targetIndex] 
        : effect.values[effect.values.length - 1] ?? 0;

      effect.value = computedValue;
      delete effect.values; 
    }
  });
}

export function clonePartyState(currentParty: PartySlots, label: string = "PlayerSetupGeneric"): PartySlots & { snapshotLabel: string } {
  // Cria uma cópia profunda isolada completa
  const cloned = JSON.parse(JSON.stringify(currentParty));

  // Itera sobre todos os slots do time clonado para estaticizar os buffs e os cooldowns
  cloned.forEach((servant: any) => {
    if (!servant || !servant.baseData) return;

    const skillLevels = servant.skillLevels || [10, 10, 10];
    const npLevel = servant.npLevel || 1;

    // 1. Trata os efeitos e tempos de recarga das Personal Skills brutas dentro do baseData clonado
    if (Array.isArray(servant.baseData.personalSkills)) {
      servant.baseData.personalSkills.forEach((skill: any) => {
        // Mapeia o slot para saber qual nível aplicar (S1, S2 ou S3)
        let targetLevel = skillLevels[0]; // Fallback S1
        if (skill.slot === 'S2') targetLevel = skillLevels[1];
        if (skill.slot === 'S3') targetLevel = skillLevels[2];

        const skillIdx = Math.max(1, targetLevel) - 1;

        // 🔥 NOVA REGRA: Extrai o baseCooldown numérico estático correspondente ao nível selecionado
        if (Array.isArray(skill.baseCooldown)) {
          const computedCooldown = skill.baseCooldown[skillIdx] !== undefined
            ? skill.baseCooldown[skillIdx]
            : skill.baseCooldown[skill.baseCooldown.length - 1] ?? 5;
            
          skill.baseCooldown = computedCooldown; // De [7, 7, 7, 7, 7, 6, 6, 6, 6, 5] vira apenas 5 (se nível 10)
        }

        // Processa os efeitos dinâmicos da skill
        if (Array.isArray(skill.effects)) {
          resolveScalingEffects(skill.effects, targetLevel, 'skillLevel');
        }
      });
    }

    // 2. Trata os efeitos do Noble Phantasm bruto dentro do baseData clonado
    if (servant.baseData.noblePhantasm) {
      const np = servant.baseData.noblePhantasm;
      const npIdx = Math.max(1, npLevel) - 1;

      console.log(`   🃏 [NEXO NP] Processando escalonamento dinâmico para [${np.nameNP || 'NP'}] (Lvl ${npLevel})`);

      /**
       * Função recursiva que caça a assinatura 'npLevel' em qualquer profundidade do objeto do NP
       */
      const buscarEAtualizarNpLevel = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;

        // Se achou uma estrutura de escalonamento por nível de NP
        if (obj.scalingType === 'npLevel') {
          // Identifica onde estão os valores (pode se chamar 'values' ou 'damageValues')
          const arrayValores = obj.values || obj.damageValues;

          if (Array.isArray(arrayValores)) {
            const valorCalculado = arrayValores[npIdx] !== undefined 
              ? arrayValores[npIdx] 
              : arrayValores[arrayValores.length - 1] ?? 0;

            // Define o valor estático escalar usando o nome esperado ('value' ou 'damageValue')
            if (obj.values !== undefined) {
              obj.value = valorCalculado;
            } else if (obj.damageValues !== undefined) {
              obj.damageValue = valorCalculado;
              
              // 🌟 SEGURANÇA PARA A FORMULA: Se for o dano bruto do NP, espelha também na raiz 
              // para que o BattleOrganizer ache a propriedade 'damageValue' de forma direta e limpa!
              np.damageValue = valorCalculado;
            }

            console.log(`   │   └─ 📈 [ESCALADO] Atributo fixado em: ${valorCalculado}%`);
          }
        }

        // Continua a busca recursiva se for uma Array (ex: o nó "effects")
        if (Array.isArray(obj)) {
          obj.forEach(item => buscarEAtualizarNpLevel(item));
        } else {
          // Continua a busca recursiva se for um Objeto (ex: o nó "power")
          for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              buscarEAtualizarNpLevel(obj[key]);
            }
          }
        }
      };

      // Dispara a varredura em toda a árvore do Noble Phantasm
      buscarEAtualizarNpLevel(np);
    }
  });

  // Acopla a propriedade nomeada (o print protegido com os dados já limpos)
  Object.defineProperty(cloned, 'snapshotLabel', {
    value: label,
    writable: true,
    enumerable: true,
    configurable: true
  });

  return cloned;
}