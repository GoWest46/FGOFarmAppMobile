import { ServantClass, getClassModifier, getClassRelation } from './Tables/classAdvantage';
import { AttributeType, getAttributeModifier } from './Tables/attributeAdvantage';
import { Card, CARD_VALUE_TABLE } from './Tables/cardTables';

export interface DamageFormulaInput {
  attackerClass: ServantClass;
  defenderClass: ServantClass;
  attackerAttribute: AttributeType;
  defenderAttribute: AttributeType;
  currentAtk: number;
  cardType: Card;
  damageValue: number;         
  superEffectiveModifier: number; 
  hitCount: number;
  hitDistribution: number[];   
  currentHp: number;           
  cardMod: number;        
  atkMod: number;         
  defMod: number;         
  powerMod: number;       
  npDamageMod: number;    
  dmgPlus: number;             
}

export interface DamageFormulaResult {
  totalDamage: number;
  finalEnemyHp: number;
  overkillArray: (0 | 1)[]; 
  hitsDamageDealt: number[]; 
}

export function calculateNpDamage(input: DamageFormulaInput): DamageFormulaResult {
  const npMultiplier = input.damageValue / 100;
  const cardDamageValue = CARD_VALUE_TABLE[input.cardType] || 1.0;
  const classAtkBonus = getClassModifier(input.attackerClass);
  const advantageModifier = getClassRelation(input.attackerClass, input.defenderClass);
  const attributeModifier = getAttributeModifier(input.attackerAttribute, input.defenderAttribute);
  
  const baseDamageCalculation = input.currentAtk * npMultiplier * (cardDamageValue * (1 + input.cardMod)) * classAtkBonus * advantageModifier * attributeModifier * 0.9 * 0.23;
  const statusModifier = 1 + input.atkMod - Math.max(-1.0, input.defMod);
  const npPowerModifier = 1 + input.powerMod + input.npDamageMod;
  const superEffectiveMultiplier = input.superEffectiveModifier / 100;

  const totalDamage = Math.max(0, Math.floor((baseDamageCalculation * statusModifier * npPowerModifier * superEffectiveMultiplier) + input.dmgPlus));

  const overkillArray: (0 | 1)[] = [];
  const hitsDamageDealt: number[] = [];
  let tempEnemyHp = input.currentHp;
  let isOverkill = tempEnemyHp <= 0;

  const safeDistribution = (Array.isArray(input.hitDistribution) && input.hitDistribution.length === input.hitCount)
    ? input.hitDistribution
    : Array(input.hitCount).fill(100 / input.hitCount);

  for (let i = 0; i < input.hitCount; i++) {
    // Usa a distribuição blindada contra undefined
    const hitPercent = safeDistribution[i] ?? (100 / input.hitCount);
    const hitDamage = Math.floor(totalDamage * (hitPercent / 100));
    hitsDamageDealt.push(hitDamage);

    if (isOverkill) {
      overkillArray.push(1);
    } else {
      tempEnemyHp -= hitDamage;
      if (tempEnemyHp <= 0) {
        overkillArray.push(0); // O hit que matou ainda conta como normal/fatal
        isOverkill = true;
        tempEnemyHp = 0;
      } else {
        overkillArray.push(0);
      }
    }
  }

  return { totalDamage, finalEnemyHp: tempEnemyHp, overkillArray, hitsDamageDealt };
}