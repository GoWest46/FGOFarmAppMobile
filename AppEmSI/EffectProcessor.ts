import { CraftEssenceBase, CEEffect } from '../DataBase/DBcraftessences'; // Ajuste o caminho se necessário
import { SkillEffect } from '../DataBase/DBEffects';

// Interface temporária do ActiveServant para o TypeScript não reclamar. 
// Certifique-se de que ela case ou use a importação oficial do seu projeto!
export interface ActiveServant {
  baseData: {
    id: string;
    name: string;
  };
  npLevel: number;
  maxNpGauge: number;
  currentNpGauge: number;
  currentAtk: number;
  maxHp: number;
  skillLevels: number[];
  activeBuffs: any[]; // O inventário de buffs do personagem
  equippedCE?: CraftEssenceBase | null;
}

/**
 * 1. Traduz um efeito estático da CE do banco de dados para um formato
 * mutável e compatível com o inventário (activeBuffs) do personagem.
 */
export function parseCEEffectToActiveBuff(
  ceEffect: CEEffect,
  isMLB: boolean,
  index: number
): any | null {
  const { effect, value, valueMLB } = ceEffect;
  
  // 🚀 SOLUÇÃO: Força o TypeScript a tratar o effect como dinâmico para aceitar chaves opcionais
  const effectAny = effect as any; 
  
  // Escolhe o valor correto baseado no estado de Max Limit Break
  const finalValue = isMLB ? valueMLB : value;

  // Se for um efeito imediato (como carga de NP), ele não vai para o inventário de turnos
  if (effect.type === 'npCharge') {
    return null;
  }

  // Gera um ID único para este buff no inventário
  const uniqueId = `buff_ce_${effect.type}_${Date.now()}_${index}`;

  // Retorna o objeto formatado pronto para o activeBuffs
  return {
    id: uniqueId,
    type: effect.type,
    cardType: effect.cardType || undefined,
    target: effect.target || 'self',
    value: finalValue,
    durationTurns: effect.durationTurns || 99, // CEs costumam ser permanentes (99 turnos)
    durationAttacks: effect.durationAttacks || undefined,
    conditions: effectAny.conditions || undefined, // 🔄 Atualizado para usar effectAny sem dar erro
    executionTiming: effect.executionTiming || undefined,
    source: 'CraftEssence' // Tag útil para sabermos de onde veio esse buff na tela de inspeção
  };
}

/**
 * 2. Varre a Craft Essence equipada, injeta os buffs contínuos no inventário
 * e aplica os efeitos de ação imediata (como baterias de NP).
 */
export function initializeServantEffects(
  servant: ActiveServant,
  ce: CraftEssenceBase,
  isMLB: boolean
): ActiveServant {
  // Evita quebras se a CE não tiver efeitos listados
  if (!ce.effects || ce.effects.length === 0) {
    return servant;
  }

  // Criamos cópias limpas dos arrays para evitar mutações diretas indesejadas
  const updatedBuffs = [...servant.activeBuffs];
  let updatedNpGauge = servant.currentNpGauge || 0;

  ce.effects.forEach((ceEffect, index) => {
    const finalValue = isMLB ? ceEffect.valueMLB : ceEffect.value;

    // Trata o caso especial: Bateria Imediata de NP
    if (ceEffect.effect.type === 'npCharge') {
      updatedNpGauge += finalValue;
      
      // Respeita o teto máximo que a barra de NP do personagem aguenta (ex: 100%, 200%, 300%)
      if (updatedNpGauge > servant.maxNpGauge) {
        updatedNpGauge = servant.maxNpGauge;
      }
    } else {
      // Trata efeitos contínuos: Converte e joga no inventário
      const activeBuff = parseCEEffectToActiveBuff(ceEffect, isMLB, index);
      if (activeBuff) {
        updatedBuffs.push(activeBuff);
      }
    }
  });

  // Retorna o servo atualizado com a nova barra de NP e o inventário populado
  return {
    ...servant,
    currentNpGauge: updatedNpGauge,
    activeBuffs: updatedBuffs
  };
}