import React, { createContext, useContext, useState } from 'react';

export interface EffectQueueItem {
  type: string;
  value?: number;
  queueId: string;
  sourceSlot: number;
  sourceSkill: string;
  target?: string;
  targetSlot?: number;
  category?: string;
  [key: string]: any; 
}

export interface VisualQueueItem {
  id: string;
  slotIndex: number;
  type: string;
  targetAllyIndex?: number;
  targetEnemyIndex?: number;
}

interface QueueContextType {
  visualQueue: VisualQueueItem[];
  effectsQueue: EffectQueueItem[];
  selectedQueueId: string | null;
  setSelectedQueueId: (id: string | null) => void;
  addSkillToQueue: (slotIndex: number, position: string, skillData: any, targetAllyIndex?: number, targetEnemyIndex?: number) => void;
  addNpToQueue: (slotIndex: number, noblePhantasm: any, targetEnemyIndex?: number) => void;
  deleteSelected: () => void;
  clearQueue: () => void;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export function QueueProvider({ children }: { children: React.ReactNode }) {
  const [visualQueue, setVisualQueue] = useState<VisualQueueItem[]>([]);
  const [effectsQueue, setEffectsQueue] = useState<EffectQueueItem[]>([]);
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);

  const addSkillToQueue = (slotIndex: number, position: string, skillData: any, targetAllyIndex?: number, targetEnemyIndex?: number) => {
    const queueId = Date.now().toString() + Math.random().toString();
    const newVisualItem: VisualQueueItem = { id: queueId, slotIndex, type: position, targetAllyIndex, targetEnemyIndex };

    const newEffects: EffectQueueItem[] = (skillData.effects || []).map((eff: any) => ({
      ...eff,
      queueId,
      sourceSlot: slotIndex,
      sourceSkill: position,
      targetSlot: eff.target === 'one_ally' ? targetAllyIndex : (eff.target === 'one_enemy' ? targetEnemyIndex : undefined)
    }));

    setVisualQueue(prev => [...prev, newVisualItem]);
    setEffectsQueue(prev => [...prev, ...newEffects]);
  };

  // =========================================================================
  // 👑 ADICIONAR NOBLE PHANTASM À FILA (PACOTE ATÔMICO CORRIGIDO)
  // =========================================================================
  const addNpToQueue = (slotIndex: number, noblePhantasm: any, targetEnemyIndex?: number) => {
    const queueId = Date.now().toString() + Math.random().toString();
    
    const rawTarget = noblePhantasm.targetType || noblePhantasm.target || '';
    const normalizedTargetType = String(rawTarget).toUpperCase().trim();
    
    let isSingleTarget = normalizedTargetType === 'ST' || normalizedTargetType === 'ONE_ENEMY' || normalizedTargetType === 'SINGLE';
    
    if (Array.isArray(noblePhantasm.DamageCategory)) {
      noblePhantasm.DamageCategory.forEach((dmg: any) => {
        const tgt = String(dmg.power?.target || dmg.target || '').toUpperCase().trim();
        if (tgt === 'ONE_ENEMY' || tgt === 'ST' || tgt === 'SINGLE') {
          isSingleTarget = true;
        }
      });
    }

    const isSupport = normalizedTargetType === 'SUPPORT';

    const newVisualItem: VisualQueueItem = {
      id: queueId,
      slotIndex,
      type: 'NP',
      targetEnemyIndex: isSingleTarget ? targetEnemyIndex : undefined
    };

    const mainDamageEffect = { 
      type: 'noblePhantasm', 
      category: 'Damage' 
    };

    // Deep clone seguro para não quebrar as referências de arrays como 'values' do Overcharge
    const secondaryEffects = noblePhantasm.effects && noblePhantasm.effects.length > 0 
      ? JSON.parse(JSON.stringify(noblePhantasm.effects)) 
      : [];

    // GARANTIA DE FLUXO: Se não for suporte e o servo for o Jason (ou buffs próprios de NP),
    // a regra geral do FGO dita que os buffs de performance ocorrem ANTES do dano para inflar o hit!
    let baseEffects: any[] = [];
    if (isSupport) {
      baseEffects = secondaryEffects;
    } else {
      // Se tiver flag explícita joga antes, senão, se o alvo for 'self' (como artsPerformUp do Jason), 
      // vai antes do dano por padrão de design do jogo
      const antesDoDano = secondaryEffects.filter((eff: any) => 
        eff.priorToDamage === true || eff.prior === true || eff.target === 'self'
      );
      const depoisDoDano = secondaryEffects.filter((eff: any) => 
        eff.priorToDamage !== true && eff.prior !== true && eff.target !== 'self'
      );
      baseEffects = [...antesDoDano, mainDamageEffect, ...depoisDoDano];
    }

    const internalSequence = baseEffects.map((eff: any) => {
      let finalTarget = eff.target;
      if (!finalTarget) {
        if (isSingleTarget) finalTarget = 'one_enemy';
        else if (isSupport) finalTarget = undefined; 
        else finalTarget = 'all_enemies'; 
      }

      if (eff.type === 'noblePhantasm' || eff.category === 'Damage') {
        const powerData = noblePhantasm.power || {};
        const dmgValues = powerData.damageValues || [];
        const finalMultiplier = noblePhantasm.damageValue || noblePhantasm.value || dmgValues[0] || 600;

        return {
          ...eff,
          category: 'Damage',
          target: finalTarget,
          targetSlot: isSingleTarget ? targetEnemyIndex : undefined,
          cardType: noblePhantasm.card || noblePhantasm.cardType || 'Buster',
          npMultiplier: finalMultiplier,
          hitCount: powerData.hitCount || noblePhantasm.hitCount || 1,
          hitDistribution: powerData.hitDistribution || noblePhantasm.hitDistribution || [100],
          superEffective: noblePhantasm.superEffective || undefined,
          DamageCategory: noblePhantasm.DamageCategory || undefined
        };
      }

      // IMPORTANTE: Mantém a estrutura original intacta para o calculador de OC do BattleOrganizer fazer o seu trabalho
      return {
        ...eff,
        category: eff.category || 'Buff',
        target: finalTarget,
        targetSlot: isSingleTarget ? targetEnemyIndex : undefined
      };
    });

    const atomicNpItem: EffectQueueItem = {
      type: 'NOBLE_PHANTASM_EXECUTE',
      queueId,
      sourceSlot: slotIndex,
      sourceSkill: 'NP',
      npSequence: internalSequence 
    };

    setVisualQueue(prev => [...prev, newVisualItem]);
    setEffectsQueue(prev => [...prev, atomicNpItem]);
  };

  const deleteSelected = () => {
    if (!selectedQueueId) return;
    setVisualQueue(prev => prev.filter(item => item.id !== selectedQueueId));
    setEffectsQueue(prev => prev.filter(eff => eff.queueId !== selectedQueueId));
    setSelectedQueueId(null);
  };

  const clearQueue = () => {
    setVisualQueue([]);
    setEffectsQueue([]);
    setSelectedQueueId(null);
  };

  return (
    <QueueContext.Provider value={{ visualQueue, effectsQueue, selectedQueueId, setSelectedQueueId, addSkillToQueue, addNpToQueue, deleteSelected, clearQueue }}>
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const context = useContext(QueueContext);
  if (!context) throw new Error('useQueue deve ser usado dentro de um QueueProvider');
  return context;
}