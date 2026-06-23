export type ServantClass = 
  | "Shielder"
  | "Saber" | "Archer" | "Lancer" | "Rider" | "Caster" | "Assassin" | "Berserker"
  | "Ruler" | "Avenger" | "MoonCancer"
  | "AlterEgo" | "Foreigner" | "Pretender"
  | "Draco" | "SpaceEresh" | "UOlga";

export const CLASS_RELATION_TABLE: Record<ServantClass, Record<ServantClass, number>> = {
    Shielder:   { Saber: 1.0, Archer: 1.0, Lancer: 1.0, Rider: 1.0, Caster: 1.0, Assassin: 1.0, Berserker: 1.0, Ruler: 1.0, Avenger: 1.0, MoonCancer: 1.0, AlterEgo: 1.0, Foreigner: 1.0, Pretender: 1.0, Draco: 1.0, SpaceEresh: 1.0, UOlga : 1.0, Shielder: 1.0},
    Saber:      { Saber: 1.0, Archer: 0.5, Lancer: 2.0, Rider: 1.0, Caster: 1.0, Assassin: 1.0, Berserker: 2.0, Ruler: 0.5, Avenger: 1.0, MoonCancer: 1.0, AlterEgo: 1.0, Foreigner: 1.0, Pretender: 1.0, Draco: 0.5, SpaceEresh: 1.0, UOlga : 0.5, Shielder: 1.0},
    Archer:     { Saber: 2.0, Archer: 1.0, Lancer: 0.5, Rider: 1.0, Caster: 1.0, Assassin: 1.0, Berserker: 2.0, Ruler: 0.5, Avenger: 1.0, MoonCancer: 1.0, AlterEgo: 1.0, Foreigner: 1.0, Pretender: 1.0, Draco: 0.5, SpaceEresh: 1.0, UOlga : 0.5, Shielder: 1.0},
    Lancer:     { Saber: 0.5, Archer: 0.5, Lancer: 2.0, Rider: 1.0, Caster: 1.0, Assassin: 1.0, Berserker: 2.0, Ruler: 0.5, Avenger: 1.0, MoonCancer: 1.0, AlterEgo: 1.0, Foreigner: 1.0, Pretender: 1.0, Draco: 0.5, SpaceEresh: 1.0, UOlga : 0.5, Shielder: 1.0},
    Rider:      { Saber: 1.0, Archer: 1.0, Lancer: 1.0, Rider: 1.0, Caster: 2.0, Assassin: 0.5, Berserker: 2.0, Ruler: 0.5, Avenger: 1.0, MoonCancer: 1.0, AlterEgo: 1.0, Foreigner: 1.0, Pretender: 1.0, Draco: 0.5, SpaceEresh: 1.0, UOlga : 0.5, Shielder: 1.0},
    Caster:     { Saber: 1.0, Archer: 0.5, Lancer: 2.0, Rider: 0.5, Caster: 1.0, Assassin: 2.0, Berserker: 2.0, Ruler: 0.5, Avenger: 1.0, MoonCancer: 1.0, AlterEgo: 1.0, Foreigner: 1.0, Pretender: 1.0, Draco: 0.5, SpaceEresh: 1.0, UOlga : 0.5, Shielder: 1.0},
    Assassin:   { Saber: 1.0, Archer: 0.5, Lancer: 2.0, Rider: 2.0, Caster: 0.5, Assassin: 1.0, Berserker: 2.0, Ruler: 0.5, Avenger: 1.0, MoonCancer: 1.0, AlterEgo: 1.0, Foreigner: 1.0, Pretender: 1.0, Draco: 0.5, SpaceEresh: 1.0, UOlga : 0.5, Shielder: 1.0},
    Berserker:  { Saber: 1.5, Archer: 1.5, Lancer: 1.5, Rider: 1.5, Caster: 1.5, Assassin: 1.5, Berserker: 1.5, Ruler: 1.5, Avenger: 1.5, MoonCancer: 1.5, AlterEgo: 1.5, Foreigner: 0.5, Pretender: 1.5, Draco: 0.5, SpaceEresh: 1.0, UOlga : 1.5, Shielder: 1.0},
    Ruler:      { Saber: 1.0, Archer: 1.0, Lancer: 1.0, Rider: 1.0, Caster: 1.0, Assassin: 1.0, Berserker: 2.0, Ruler: 1.0, Avenger: 2.0, MoonCancer: 2.0, AlterEgo: 1.0, Foreigner: 1.0, Pretender: 1.0, Draco: 2.0, SpaceEresh: 0.5, UOlga : 1.0, Shielder: 1.0},
    Avenger:    { Saber: 1.0, Archer: 1.0, Lancer: 1.0, Rider: 1.0, Caster: 1.0, Assassin: 1.0, Berserker: 2.0, Ruler: 2.0, Avenger: 0.5, MoonCancer: 1.0, AlterEgo: 1.0, Foreigner: 1.0, Pretender: 1.0, Draco: 2.0, SpaceEresh: 2.0, UOlga : 2.0, Shielder: 1.0},
    MoonCancer: { Saber: 1.0, Archer: 1.0, Lancer: 1.0, Rider: 1.0, Caster: 1.0, Assassin: 1.0, Berserker: 2.0, Ruler: 0.5, Avenger: 1.0, MoonCancer: 1.0, AlterEgo: 1.0, Foreigner: 1.0, Pretender: 1.0, Draco: 2.0, SpaceEresh: 0.5, UOlga : 0.5, Shielder: 1.0},
    AlterEgo:   { Saber: 0.5, Archer: 0.5, Lancer: 0.5, Rider: 1.5, Caster: 1.5, Assassin: 1.5, Berserker: 2.0, Ruler: 1.0, Avenger: 1.0, MoonCancer: 1.0, AlterEgo: 1.0, Foreigner: 2.0, Pretender: 0.5, Draco: 2.0, SpaceEresh: 0.5, UOlga : 1.0, Shielder: 1.0},
    Foreigner:  { Saber: 1.0, Archer: 1.0, Lancer: 1.0, Rider: 1.0, Caster: 1.0, Assassin: 1.0, Berserker: 2.0, Ruler: 1.0, Avenger: 1.0, MoonCancer: 1.0, AlterEgo: 0.5, Foreigner: 2.0, Pretender: 2.0, Draco: 2.0, SpaceEresh: 0.5, UOlga : 2.0, Shielder: 1.0},
    Pretender:  { Saber: 1.5, Archer: 1.5, Lancer: 1.5, Rider: 0.5, Caster: 0.5, Assassin: 0.5, Berserker: 2.0, Ruler: 1.0, Avenger: 1.0, MoonCancer: 1.0, AlterEgo: 2.0, Foreigner: 0.5, Pretender: 1.0, Draco: 2.0, SpaceEresh: 0.5, UOlga : 1.0, Shielder: 1.0},
    Draco:      { Saber: 1.5, Archer: 1.5, Lancer: 1.5, Rider: 1.5, Caster: 1.5, Assassin: 1.5, Berserker: 2.0, Ruler: 0.5, Avenger: 0.5, MoonCancer: 0.5, AlterEgo: 0.5, Foreigner: 0.5, Pretender: 0.5, Draco: 1.0, SpaceEresh: 1.0, UOlga : 1.0, Shielder: 1.0},
    SpaceEresh: { Saber: 1.0, Archer: 1.0, Lancer: 1.0, Rider: 1.0, Caster: 1.0, Assassin: 1.0, Berserker: 1.0, Ruler: 1.5, Avenger: 0.5, MoonCancer: 1.5, AlterEgo: 1.5, Foreigner: 1.5, Pretender: 1.5, Draco: 1.0, SpaceEresh: 1.0, UOlga : 1.0, Shielder: 1.0},
    UOlga:      { Saber: 1.0, Archer: 1.0, Lancer: 1.0, Rider: 1.0, Caster: 1.0, Assassin: 1.0, Berserker: 2.0, Ruler: 1.0, Avenger: 0.5, MoonCancer: 2.0, AlterEgo: 1.0, Foreigner: 2.0, Pretender: 1.0, Draco: 1.0, SpaceEresh: 1.0, UOlga : 1.0, Shielder: 1.0},
} as const;

/**
 * Função utilitária simples para buscar a vantagem de atributo
 */
export function getClassRelation(attacker: ServantClass, defender: ServantClass): number {
  return CLASS_RELATION_TABLE[attacker]?.[defender] || 1.0;
}

//Por algum motivo, os devs decidiram prejudicar algumas classes
export const CLASS_DAMAGE_MODIFIER_TABLE: Record<ServantClass, number> = {
  Saber: 1.0,
  Archer: 0.95,
  Lancer: 1.05,
  Rider: 1.0,
  Caster: 0.9,
  Assassin: 0.9,
  Berserker: 1.1,
  Shielder: 1.0,
  Ruler: 1.1,
  Avenger: 1.1,
  MoonCancer: 1.0,
  AlterEgo: 1.0,
  Foreigner: 1.0,
  Pretender: 1.0,
  Draco: 1.0,      
  SpaceEresh: 1.0, 
  UOlga: 1.0,      
} as const;

/**
 * Função utilitária para buscar o multiplicador de dano da classe do atacante
 */
export function getClassModifier(attackerClass: ServantClass): number {
  return CLASS_DAMAGE_MODIFIER_TABLE[attackerClass] || 1.0;
}


//A classe do alvo interfere na geração de NP
export const CLASS_NPGEN_MODIFIER_TABLE: Record<ServantClass, number> = {
  Saber: 1.0,
  Archer: 1.0,
  Lancer: 1.0,
  Rider: 1.1,
  Caster: 1.2,
  Assassin: 0.9,
  Berserker: 0.8,
  Shielder: 1.0,
  Ruler: 1.0,
  Avenger: 1.0,
  MoonCancer: 1.2,
  AlterEgo: 1.0,
  Foreigner: 1.0,
  Pretender: 1.0,
  Draco: 1.0,      
  SpaceEresh: 1.0, 
  UOlga: 1.0,      
} as const;
export function getClassNpGenModifier(defenderClass: ServantClass): number {
  return CLASS_DAMAGE_MODIFIER_TABLE[defenderClass] || 1.0;
}