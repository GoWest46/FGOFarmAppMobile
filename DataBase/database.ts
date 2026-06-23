import { SkillEffect } from "./DBEffects";
import { NpDamage, NpSuperEffective } from "./DBnp";

export interface PersonalSkill {
  name: string;
  slot: 'S1' | 'S2' | 'S3';
  effects: SkillEffect[];
  baseCooldown: {
    lvl6: number; // Valor A (Ex: 6 turnos)
    lvl9: number;
    lvl10: number;  // Valor B (Ex: 5 turnos)
  }
}
export interface ClassSkill {
  effects: SkillEffect[] & {defaultRemovable: false; overrideRemovable?: false;}[]
};


export interface NoblePhantasm {
  nameNP: string;
  cardType: 'Arts' | 'Buster' | 'Quick';
  category: 'Damage' | 'Status';
  power?: NpDamage;
  extraDamage?: NpSuperEffective;
  effects?: (SkillEffect & { priorToDamage: boolean })[];
}
