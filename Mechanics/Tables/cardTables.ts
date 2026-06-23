export type Card =
| "Quick" | "Arts"| "Buster";

//Cada tipo de carta tem um modificador de força diferente
export const CARD_VALUE_TABLE: Record<Card, number> = {
    Quick: 0.8,
    Arts: 1.0,
    Buster: 1.5,
} as const;

//Cada tipo de carta tem um valor de NP gain diferente
export const CARD_NP_TABLE: Record<Card, number> = {
    Quick: 1,
    Arts: 3,
    Buster: 0,
} as const;