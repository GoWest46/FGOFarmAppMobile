// --- 1. CONFIGURAÇÕES BRUTAS DE DANO ---
export type NpTargetType = 'ST' | 'AoE' | 'Splash';
export type NpScalingType = 'fixed' | 'npLevel' | 'oc';


export interface NpDamage {
  targetType: NpTargetType;
  hitCount: number;
  hitDistribution: number[]; // Array com os pesos de cada hit (ex: [4, 9, 14, 19, 23, 31])
  scalingType: NpScalingType;
  damageValues: number[];     // Geralmente 5 valores (NP1 a NP5)
}


// --- 2. SISTEMA DE DANO SUPEREFETIVO (SUPER EFFECTIVE) ---
export interface NpSuperEffective {
  // Caso 1: Requer Trait, Atributo, Classe ou Status simples no alvo
  dmgAgainst?: {
    traits?: string[];
    attributes?: string[];
    classes?: string[];
    status?: string[];
  };


  // Caso 2: Fórmula baseada em "N" Status acumulados no ALVO (Ex: Romulus)
  targetStatusStack?: {
    statusName: string;
    multiplierPerStack: number; // Quanto o dano aumenta por acumulador
    maxStacks: number;          // Valor máximo de N
  };


  // Caso 3: Fórmula baseada em "N" Status acumulados no ATACANTE
  attackerStatusStack?: {
    statusName: string;
    multiplierPerStack: number;
    maxStacks: number;
  };


  scalingType: NpScalingType;
  values: number[]; // Valores base multiplicadores (ex: [150, 162.5, 175, 187.5, 200])
}
