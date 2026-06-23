import { Card } from "../Mechanics/Tables/cardTables";
import { Traits } from "./DBtraits";
import { AttributeType } from "../Mechanics/Tables/attributeAdvantage";
import { ServantClass } from "../Mechanics/Tables/classAdvantage";
import { BattlefieldType } from "./DBnodes";

// --- 1. CATEGORIAS DE REMOÇÃO / PURGA ---
export type EffectCategory = 'Buff' | 'Debuff' | 'Healing' | 'None';
export type EffectSubCategory = 'Offensive' | 'Defensive' | 'Mental' | 'Ailment' | 'Lockdown' | 'Immobility' | 'Sealing' | 'Heal' | 'Damage' | 'Demerit';
export type EffectTrigger = 'Immediate' | 'TurnEnd' | 'OnAttack' | 'OnDeath' | 'OnGuts' | 'OnTurn';

// O EffectSearchQuery agora puxa os tipos dinamicamente do seu catálogo!
export interface EffectSearchQuery {
  byType?: EffectMetadata['type']; 
  byCategory?: EffectCategory;
  bySubCategory?: EffectSubCategory;
}

export interface enemyTargetCondition {
    hasTraits?: Traits[]; 
    hasAttribute?: AttributeType[]; 
    hasClasses?: ServantClass[]; 
    hasEffect?: EffectSearchQuery; 
}

export interface applyCondition {
  fieldCondition?: BattlefieldType[]; 
  hasAttributes?: AttributeType[]; 
  hasTraits?: Traits[]; 
}

export interface activationCondition {
  hpLessThanPercent?: number;
}

export interface skillUsageCondition {
  requireStarCount?: number;
  hpLessThanPercent?: number;
}

// --- 2. LISTA MESTRE DE TIPOS DE EFEITO (Focado em Skills/Passivas/CEs) ---
export type EffectMetadata =
  | { type: 'atkUp';                  defaultCategory: 'Buff';    defaultTrigger: 'Immediate'; defaultSubCategory: 'Offensive';                                   defaultRemovable: true;  }
  | { type: 'quickPerformUp';         defaultCategory: 'Buff';    defaultTrigger: 'Immediate'; defaultSubCategory: 'Offensive';                                   defaultRemovable: true;  }
  | { type: 'artsPerformUp';          defaultCategory: 'Buff';    defaultTrigger: 'Immediate'; defaultSubCategory: 'Offensive';                                   defaultRemovable: true;  }
  | { type: 'busterPerformUp';        defaultCategory: 'Buff';    defaultTrigger: 'Immediate'; defaultSubCategory: 'Offensive';                                   defaultRemovable: true;  }
  | { type: 'dmgAdd';                 defaultCategory: 'Buff';    defaultTrigger: 'Immediate'; defaultSubCategory: 'Offensive';                                   defaultRemovable: true;  }
  | { type: 'antiDmgUp';              defaultCategory: 'Buff';    defaultTrigger: 'Immediate'; defaultSubCategory: 'Offensive';                                   defaultRemovable: true;  }
  | { type: 'hitCountUp';             defaultCategory: 'Buff';    defaultTrigger: 'Immediate'; defaultSubCategory: 'Offensive';                                   defaultRemovable: true;  }
  | { type: 'npDmgUp';                defaultCategory: 'Buff';    defaultTrigger: 'Immediate'; defaultSubCategory: 'Offensive';                                   defaultRemovable: true;  }
  | { type: 'npDmgBoostUp';           defaultCategory: 'Buff';    defaultTrigger: 'Immediate'; defaultSubCategory: 'Offensive';                                   defaultRemovable: true;  }
  | { type: 'ocStageUp';              defaultCategory: 'Buff';    defaultTrigger: 'Immediate';                                                                    defaultRemovable: true;  }
  | { type: 'npGenUp';                defaultCategory: 'Buff';    defaultTrigger: 'Immediate';                                                                    defaultRemovable: true;  }
  | { type: 'npRegen';                defaultCategory: 'Buff';    defaultTrigger: 'TurnEnd';                                                                      defaultRemovable: true;  }
  | { type: 'npCharge';                                           defaultTrigger: 'Immediate';                                                                    defaultRemovable: false; }
  | { type: 'npMultiply';                                         defaultTrigger: 'Immediate';                                                                    defaultRemovable: false; }
  | { type: 'starGain';                                           defaultTrigger: 'Immediate';                                                                    defaultRemovable: false; }
  | { type: 'starGenUp';              defaultCategory: 'Buff';    defaultTrigger: 'Immediate';                                                                    defaultRemovable: true;  }
  | { type: 'starRegen';              defaultCategory: 'Buff';    defaultTrigger: 'TurnEnd';                                                                      defaultRemovable: true;  }
  | { type: 'defUp';                  defaultCategory: 'Buff';    defaultTrigger: 'Immediate'; defaultSubCategory: 'Defensive';                                   defaultRemovable: true;  }
  | { type: 'dmgCut';                 defaultCategory: 'Buff';    defaultTrigger: 'Immediate'; defaultSubCategory: 'Defensive';                                   defaultRemovable: true;  }
  | { type: 'npDmgResUp';             defaultCategory: 'Buff';    defaultTrigger: 'Immediate'; defaultSubCategory: 'Defensive';                                   defaultRemovable: true;  }
  | { type: 'evasion';                defaultCategory: 'Buff';    defaultTrigger: 'Immediate'; defaultSubCategory: 'Defensive';                                   defaultRemovable: true;  }
  | { type: 'invul';                  defaultCategory: 'Buff';    defaultTrigger: 'Immediate'; defaultSubCategory: 'Defensive';                                   defaultRemovable: true;  }
  | { type: 'antiPurge';              defaultCategory: 'Buff';    defaultTrigger: 'Immediate'; defaultSubCategory: 'Defensive';                                   defaultRemovable: true;  }
  | { type: 'debuffImmun';            defaultCategory: 'Buff';    defaultTrigger: 'Immediate'; defaultSubCategory: 'Defensive';                                   defaultRemovable: true;  }
  | { type: 'quickResUp';             defaultCategory: 'Buff';    defaultTrigger: 'Immediate'; defaultSubCategory: 'Defensive';                                   defaultRemovable: true;  }
  | { type: 'artsResUp';              defaultCategory: 'Buff';    defaultTrigger: 'Immediate'; defaultSubCategory: 'Defensive';                                   defaultRemovable: true;  }
  | { type: 'busterResUp';            defaultCategory: 'Buff';    defaultTrigger: 'Immediate'; defaultSubCategory: 'Defensive';                                   defaultRemovable: true;  }
  | { type: 'cdReduct';                                           defaultTrigger: 'Immediate';                                                                    defaultRemovable: false; }
  | { type: 'buffSuccUp';             defaultCategory: 'Buff';    defaultTrigger: 'Immediate';                                                                    defaultRemovable: true;  }
  | { type: 'buffOnAttack';           defaultCategory: 'Buff';    defaultTrigger: 'OnAttack';                                                                     defaultRemovable: true;  }
  | { type: 'debuffOnAttack';         defaultCategory: 'Buff';    defaultTrigger: 'OnAttack';                                                                     defaultRemovable: true;  }
  | { type: 'buffDelayed';            defaultCategory: 'Buff';    defaultTrigger: 'TurnEnd';                                                                      defaultRemovable: true;  }
  | { type: 'buffRegen';              defaultCategory: 'Buff';    defaultTrigger: 'TurnEnd';                                                                      defaultRemovable: true;  }
  | { type: 'onGuts';                 defaultCategory: 'Buff';    defaultTrigger: 'OnGuts';                                                                       defaultRemovable: true;  }
  | { type: 'onDeath';                defaultCategory: 'Buff';    defaultTrigger: 'OnDeath';                                                                      defaultRemovable: true;  }
  | { type: 'enterField';             defaultCategory: 'Buff';    defaultTrigger: 'Immediate';                                                                    defaultRemovable: true;  }
  | { type: 'enterTurn';              defaultCategory: 'Buff';    defaultTrigger: 'OnTurn';                                                                       defaultRemovable: true;  }
  | { type: 'heal';                   defaultCategory: 'Healing'; defaultTrigger: 'Immediate'; defaultSubCategory: 'Heal';                                        defaultRemovable: false; }
  | { type: 'hpRegen';                defaultCategory: 'Buff';    defaultTrigger: 'TurnEnd';   defaultSubCategory: 'Heal';                                        defaultRemovable: true;  }
  | { type: 'guts';                   defaultCategory: 'Buff';    defaultTrigger: 'OnDeath';                                                                      defaultRemovable: true;  }
  | { type: 'maxHPUp';                defaultCategory: 'Buff';    defaultTrigger: 'Immediate';                                                                    defaultRemovable: true;  }
  | { type: 'healRateUp';             defaultCategory: 'Buff';    defaultTrigger: 'Immediate';                                                                    defaultRemovable: true;  }
  | { type: 'healPowerUp';            defaultCategory: 'Buff';    defaultTrigger: 'Immediate';                                                                    defaultRemovable: true;  }
  | { type: 'DoTHeal';                defaultCategory: 'Buff';    defaultTrigger: 'TurnEnd';                                                                      defaultRemovable: true;  }
  | { type: 'stageChange';                                        defaultTrigger: 'Immediate';                                                                    defaultRemovable: true;  }
  | { type: 'stun';                   defaultCategory: 'Debuff';  defaultTrigger: 'Immediate'; defaultSubCategory: ['Lockdown', 'Immobility'];                    defaultRemovable: true;  }
  | { type: 'bond';                   defaultCategory: 'Debuff';  defaultTrigger: 'Immediate'; defaultSubCategory: ['Lockdown', 'Immobility'];                    defaultRemovable: true;  }
  | { type: 'petrify';                defaultCategory: 'Debuff';  defaultTrigger: 'Immediate'; defaultSubCategory: ['Lockdown', 'Immobility'];                    defaultRemovable: true;  }
  | { type: 'charm';                  defaultCategory: 'Debuff';  defaultTrigger: 'Immediate'; defaultSubCategory: ['Lockdown', 'Immobility', 'Mental'];          defaultRemovable: true;  }
  | { type: 'sleep';                  defaultCategory: 'Debuff';  defaultTrigger: 'Immediate'; defaultSubCategory: ['Lockdown', 'Immobility', 'Mental'];          defaultRemovable: true;  }
  | { type: 'skillSeal';              defaultCategory: 'Debuff';  defaultTrigger: 'Immediate'; defaultSubCategory: ['Lockdown', 'Immobility'];                    defaultRemovable: true;  }
  | { type: 'atkDown';                defaultCategory: 'Debuff';  defaultTrigger: 'Immediate'; defaultSubCategory: 'Offensive';                                   defaultRemovable: true;  }
  | { type: 'npDmgDown';              defaultCategory: 'Debuff';  defaultTrigger: 'Immediate'; defaultSubCategory: 'Offensive';                                   defaultRemovable: true;  }
  | { type: 'npDmgResDown';           defaultCategory: 'Debuff';  defaultTrigger: 'Immediate'; defaultSubCategory: 'Defensive';                                   defaultRemovable: true;  }
  | { type: 'defDown';                defaultCategory: 'Debuff';  defaultTrigger: 'Immediate'; defaultSubCategory: 'Defensive';                                   defaultRemovable: true;  }
  | { type: 'dmgRec';                 defaultCategory: 'Debuff';  defaultTrigger: 'Immediate'; defaultSubCategory: 'Defensive';                                   defaultRemovable: true;  }
  | { type: 'quickResDown';           defaultCategory: 'Debuff';  defaultTrigger: 'Immediate'; defaultSubCategory: 'Defensive';                                   defaultRemovable: true;  }
  | { type: 'artsResDown';            defaultCategory: 'Debuff';  defaultTrigger: 'Immediate'; defaultSubCategory: 'Defensive';                                   defaultRemovable: true;  }  
  | { type: 'busterResDown';          defaultCategory: 'Debuff';  defaultTrigger: 'Immediate'; defaultSubCategory: 'Defensive';                                   defaultRemovable: true;  }  
  | { type: 'terror';                 defaultCategory: 'Debuff';  defaultTrigger: 'TurnEnd';   defaultSubCategory: 'Mental';                                      defaultRemovable: true;  }
  | { type: 'confusion';              defaultCategory: 'Debuff';  defaultTrigger: 'TurnEnd';   defaultSubCategory: 'Mental';                                      defaultRemovable: true;  }
  | { type: 'healRateDown';           defaultCategory: 'Debuff';  defaultTrigger: 'Immediate';                                                                    defaultRemovable: true;  }
  | { type: 'healloss';               defaultCategory: 'Damage';  defaultTrigger: 'Immediate';                                                                    defaultRemovable: false; }
  | { type: 'heallossTurn';           defaultCategory: 'Damage';  defaultTrigger: 'TurnEnd';                                                                      defaultRemovable: false; }
  | { type: 'burn';                   defaultCategory: 'Debuff';  defaultTrigger: 'TurnEnd';   defaultSubCategory: 'Ailment';                                     defaultRemovable: true;  }
  | { type: 'curse';                  defaultCategory: 'Debuff';  defaultTrigger: 'TurnEnd';   defaultSubCategory: 'Ailment';                                     defaultRemovable: true;  }
  | { type: 'poison';                 defaultCategory: 'Debuff';  defaultTrigger: 'TurnEnd';   defaultSubCategory: 'Ailment';                                     defaultRemovable: true;  }
  | { type: 'burnAmp';                defaultCategory: 'Debuff';  defaultTrigger: 'TurnEnd';                                                                      defaultRemovable: true;  }
  | { type: 'curseAmp';               defaultCategory: 'Debuff';  defaultTrigger: 'TurnEnd';                                                                      defaultRemovable: true;  }
  | { type: 'poisonAmp';              defaultCategory: 'Debuff';  defaultTrigger: 'TurnEnd';                                                                      defaultRemovable: true;  }
  | { type: 'buffBlock';              defaultCategory: 'Debuff';  defaultTrigger: 'Immediate';                                                                    defaultRemovable: true;  }
  | { type: 'debuffDelayed';          defaultCategory: 'Debuff';  defaultTrigger: 'TurnEnd';                                                                      defaultRemovable: true;  }
  | { type: 'debuffExtend';                                       defaultTrigger: 'Immediate';                                                                    defaultRemovable: false; }
  | { type: 'traitAdd';                                           defaultTrigger: 'Immediate';                                                                    defaultRemovable: true;  }
  | { type: 'classChange';                                        defaultTrigger: 'Immediate';                                                                    defaultRemovable: true;  }
  | { type: 'classAffinityChange';                                defaultTrigger: 'Immediate';                                                                    defaultRemovable: true;  }
  | { type: 'blessingOfKur';          defaultCategory: 'Buff';    defaultTrigger: 'Immediate';                                                                   defaultRemovable: true;  }
  | { type: 'pigify';                 defaultCategory: 'Debuff';  defaultTrigger: 'Immediate'; defaultSubCategory: ['Lockdown', 'Immobility'];                    defaultRemovable: true;  }
  | { type: 'wrathOfEnshrinedDeity';  defaultCategory: 'Buff';    defaultTrigger: 'Immediate';                                                                    defaultRemovable: true;  }
  | { type: 'princeInAWhiteHorse';                                defaultTrigger: 'Immediate';                                                                    defaultRemovable: true;  }
  | { type: 'bravePrincess';                                      defaultTrigger: 'Immediate';                                                                    defaultRemovable: true;  }
  | { type: 'holyGrailHolding';                                   defaultTrigger: 'Immediate';                                                                    defaultRemovable: true;  } 
  | { type: 'underTheMoonlight';                                  defaultTrigger: 'Immediate';                                                                    defaultRemovable: false; } 
  | { type: 'underTheSun';                                        defaultTrigger: 'Immediate';                                                                    defaultRemovable: false; } 
  | { type: 'wrathoftheElemental';    defaultCategory: 'Buff';    defaultTrigger: 'Immediate';                                                                    defaultRemovable: true;  }
  | { type: 'preservationTarget';     defaultCategory: 'Buff';    defaultTrigger: 'Immediate';                                                                    defaultRemovable: true;  }
  | { type: 'pastAlteration';         defaultCategory: 'Debuff';  defaultTrigger: 'Immediate';                                                                    defaultRemovable: true;  }
  | { type: 'heartfeltBlaze';         defaultCategory: 'Debuff';  defaultTrigger: 'Immediate';                                                                    defaultRemovable: true;  }
  | { type: 'manuscritpCompletion';   defaultCategory: 'Buff';    defaultTrigger: 'Immediate';                                                                    defaultRemovable: true;  }
  | { type: 'thirstforVengence';      defaultCategory: 'Buff';    defaultTrigger: 'Immediate';                                                                    defaultRemovable: true;  }
  | { type: 'Bewitchment';            defaultCategory: 'Debuff';  defaultTrigger: 'Immediate'; defaultSubCategory: 'Mental';                                      defaultRemovable: true;  }
  | { type: 'magicBullet';            defaultCategory: 'Buff';    defaultTrigger: 'Immediate';                                                                    defaultRemovable: true;  }
  | { type: 'swordSheathingInstance'; defaultCategory: 'Buff';    defaultTrigger: 'Immediate';                                                                    defaultRemovable: true;  }
  | { type: 'heroicKing';             defaultCategory: 'Buff';    defaultTrigger: 'Immediate';                                                                    defaultRemovable: true;  };


type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;
// --- 5. INTERFACE MESTRE: SKILL EFFECT ---
export type SkillEffect = DistributiveOmit<
  EffectMetadata, 
  'defaultCategory' | 'defaultTrigger' | 'defaultSubCategory' | 'defaultRemovable'
> & {
  target: 'self' | 'except_self' | 'one_ally' | 'party' | 'one_enemy' | 'all_enemies' | 'field' | 'star_Count';
  
  durationAttacks?: number;
  durationTurns?: number;
  enemyTargetCondition?: enemyTargetCondition;
  applyCondition?: applyCondition;
  activationCondition?: activationCondition;
  skillUsageCondition?: skillUsageCondition;


  
  scalingType: 'fixed' | 'skillLevel' | 'npLevel' | 'oc';
  values?: number[];
  value?: number;
  
  formula?: (stackCount: number) => number;

  // Modificadores de exceção para Skills complexas do jogo
  overrideCategory?: EffectCategory;
  overrideSubCategory?: EffectSubCategory[];
  
  // Permite forçar o efeito a virar Irremovível (false)
  overrideRemovable?: boolean; 
  
  // Armazena strings mutadoras específicas (Ex: 'Demonic' para traitAdd, ou 'Lancer' para classChange)
  metaString?: string; 

  // Configurações para habilidades de Limpeza/Purga (Debuff Clean / Buff Removal)
  searchQuery?: EffectSearchQuery;
  cleanCount?: number;

  subEffects?: SkillEffect[]; // 🌟 Permite que um buff carregue outros efeitos dentro dele!
  
  executionTiming?: 'before_damage' | 'after_damage'; 
};