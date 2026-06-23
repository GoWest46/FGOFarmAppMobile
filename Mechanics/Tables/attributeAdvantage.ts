export type AttributeType = 'Man' | 'Earth' | 'Sky' | 'Star' | 'Beast';

// Record<Atacante, Record<Defensor, Multiplicador>>
export const ATTRIBUTE_ADVANTAGE_TABLE: Record<AttributeType, Record<AttributeType, number>> = {
  Man:   { Man: 1.0, Earth: 0.9, Sky: 1.1, Star: 1.0, Beast: 1.0 },
  Earth: { Man: 1.1, Earth: 1.0, Sky: 0.9, Star: 1.0, Beast: 1.0 },
  Sky:   { Man: 0.9, Earth: 1.1, Sky: 1.0, Star: 1.0, Beast: 1.0 },
  Star:  { Man: 1.0, Earth: 1.0, Sky: 1.0, Star: 1.0, Beast: 1.1 }, // Star dá 1.1 em quase tudo
  Beast: { Man: 1.0, Earth: 1.0, Sky: 1.0, Star: 1.1, Beast: 1.0 },
} as const;

/**
 * Função utilitária simples para buscar a vantagem de atributo
 */
export function getAttributeModifier(attacker: AttributeType, defender: AttributeType): number {
  return ATTRIBUTE_ADVANTAGE_TABLE[attacker]?.[defender] || 1.0;
}