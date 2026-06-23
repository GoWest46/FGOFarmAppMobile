import { SkillEffect, EffectMetadata } from "./DBEffects";
import { Card } from "../Mechanics/Tables/cardTables";

// 1. Estrutura de um Efeito Individual da CE baseado no DBEffects
// Usamos o tipo de dados nativo de efeitos, trocando apenas o array de "values" por valores fixos Normal e MLB
export interface CEEffect {
  effect: Omit<SkillEffect, 'scalingType' | 'values' | 'value'> & { cardType?: Card }; 
  value: number;    // Valor normal (Ex: 10 para +10% Arts)
  valueMLB: number; // Valor se estiver Max Limit Broken (Ex: 15 para +15% Arts)
}

// 2. Ficha de Identidade Base da Craft Essence
export interface CraftEssenceBase {
  id: string;
  name: string;
  ceAtk?: number;       // Valor de ATK máximo (editável depois no PartySetup)
  ceHp?: number;        // HP opcional (algumas CEs dão apenas ATK ou apenas HP)
  effects?: CEEffect[]; // Lista de passivas da CE usando a nova estrutura
}

// 3. O Banco de Dados de Craft Essences Atualizado
export const CRAFT_ESSENCES_DB: CraftEssenceBase[] = [
  //Kaleidoscope
  {
    id: 'ce34',
    name: 'Kaleidoscope',
    ceAtk: 2000,
    effects: [
      { 
        effect: { type: 'npCharge', target: 'self' },
        value: 80, 
        valueMLB: 100 
      }
    ]
  },

  //Black Grail
  {
    id: 'ce48',
    name: 'Black Grail',
    ceAtk: 2400,
    effects: [
      { 
        effect: { type: 'npDmgUp', target: 'self' },
        value: 60, 
        valueMLB: 80 
      },
      { 
        effect: { type: 'heallossTurn', target: 'self' },
        value: 500, 
        valueMLB: 500 
      }
    ]
  },

  //Golden Sumo
  {
    id: 'ce261',
    name: 'Golden Sumo',
    ceAtk: 2000,
    effects: [
      { 
        effect: { type: 'busterPerformUp', target: 'self' }, 
        value: 10, 
        valueMLB: 15 
      },
      { 
        effect: { type: 'npCharge', target: 'self' }, 
        value: 30, 
        valueMLB: 50 
      }
    ]
  },

  //Mark on Smiling Face
  {
    id: 'ce931',
    name: 'Mark on a Smiling Face',
    ceAtk: 2000,
    effects: [
      { 
        effect: { type: 'artsPerformUp', target: 'self' }, 
        value: 10, 
        valueMLB: 15 
      },
      { 
        effect: { type: 'npGenUp', target: 'self' }, 
        value: 10, 
        valueMLB: 15 
      },
      { 
        effect: { type: 'npDmgUp', target: 'self' }, 
        value: 15, 
        valueMLB: 20 
      }
    ]
  },

  //Silver-Glittering Snow Goddesses
  {
    id: 'ce934',
    name: 'Silver-Glittering Snow Goddesses',
    ceAtk: 1000,
    ceHp: 16000,
    effects: [
      { 
        effect: { type: 'quickPerformUp', target: 'self' }, 
        value: 6, 
        valueMLB: 8  
      },
      { 
        effect: { type: 'artsPerformUp', target: 'self' }, 
        value: 6, 
        valueMLB: 8 
      },
      { 
        effect: { type: 'busterPerformUp', target: 'self' }, 
        value: 6, 
        valueMLB: 8 
      },
      { 
        effect: { type: 'npCharge', target: 'self' }, 
        value: 30, 
        valueMLB: 50 
      }
    ]
  },

  //See Emptiness as the Path
  {
    id: 'ce1140',
    name: 'See Emptiness as the Path',
    ceAtk: 2000,
    effects: [
      { 
        effect: { type: 'npDmgUp', target: 'self' }, 
        value: 15, 
        valueMLB: 20 
      },
      { 
        effect: { type: 'npGenUp', target: 'self' }, 
        value: 15, 
        valueMLB: 20 
      }
    ]
  },

  //Ocean Flyer
  {
    id: 'ce1474',
    name: 'Ocean Flyer',
    ceAtk: 2000,
    effects: [
      { 
        effect: { type: 'artsPerformUp', target: 'self' }, 
        value: 10, 
        valueMLB: 15 
      },
      { 
        effect: { type: 'npDmgUp', target: 'self' }, 
        value: 10, 
        valueMLB: 20 
      },
      { 
        effect: { type: 'npCharge', target: 'self' }, 
        value: 30, 
        valueMLB: 50 
      }
    ]
  },

  //Someday, We Can Cross Through the River of Stars
  {
    id: 'ce2053',
    name: 'Someday, We Can Cross Through the River of Stars',
    ceAtk: 1000,
    ceHp: 1600,
    effects: [
      { 
        effect: { type: 'quickPerformUp', target: 'self' },  
        value: 6, 
        valueMLB: 8 
      },
      { 
        effect: { type: 'busterPerformUp', target: 'self' }, 
        value: 6, 
        valueMLB: 8 
      },
      { 
        effect: { type: 'starRegen', target: 'self' }, 
        value: 3, 
        valueMLB: 4
      }
    ]
  },

  //Mr Red Gadget
  {
    id: 'ce2056',
    name: 'Mr. Red Gadget',
    ceAtk: 1000,
    ceHp: 1600,
    effects: [
      { 
        effect: { type: 'artsPerformUp', target: 'self' }, 
        value: 4, 
        valueMLB: 6 
      },
      { 
        effect: { type: 'busterPerformUp', target: 'self' }, 
        value: 4, 
        valueMLB: 6 
      },
      { 
        effect: { type: 'npCharge', target: 'self' }, 
        value: 30, 
        valueMLB: 50 
      }
    ]
  },
];