import { CraftEssenceBase } from "./DBcraftessences"; // Mantido em .ts por enquanto

// 1. Definição da estrutura que uma Comp Pré-definida DEVE ter
export interface PreMadeComp {
  id: string;         // Identificador único da composição
  name: string;       // Nome que vai aparecer no ScrollView/Picker
  
  // 🌟 Divisão em Frontline (Linha de frente) e Backline (Reserva)
  // Referencia diretamente os IDs das strings contidas no DBServants.json
  frontlineServantIds: [string | null, string | null, string | null];
  backlineServantIds: [string | null, string | null, string | null];
  
  frontlineCeIds: [string | null, string | null, string | null];
  backlineCeIds: [string | null, string | null, string | null];
}

// 2. O Banco de Dados de Composições Pré-definidas
export const PRE_MADE_COMPS_DB: PreMadeComp[] = [
  {
    id: "comp_01",
    name: "Teste",
    // IDs correspondentes aos objetos dentro de DBServants.json
    frontlineServantIds: ["0003", "0002", "0002"],
    frontlineCeIds: [null, null, null],
    // Slot 4, 5 e 6 de reserva (Vazio por padrão para o jogador escolher)
    backlineServantIds: [null, null, null],
    backlineCeIds: [null, null, null]
  },
];