// Importa o tipo de classe dos Servos (ex: Saber, Archer) para tipar a classe dos inimigos
import { ServantClass } from "../Mechanics/Tables/classAdvantage";

// 🌟 CORREÇÃO DEFINITIVA: Importação via require com caminhos e maiúsculas milimétricas
const NodesImport = require("../DataBase/DBNodes.json");
const EnemiesImport = require("../DataBase/DBEnemies.json");

const NodesData = NodesImport as any;
const EnemiesData = EnemiesImport as any;

// Mantemos as definições de tipo locais para garantir o Typings do TypeScript no resto do app
export type BattlefieldType =
  | "Sunlight" | "Forest" | "Waterside" | "Burning" | "City" | "Darkness"
  | "Air Space" | "Heaven" | "Hell" | "MilleniumCastle" | "Halloween";

export interface NodeEnemy {
  enemyBaseId?: string;
  id?: string;
  customClass: ServantClass;
  customHp: number;
}

export interface NodeWave {
  waveNumber: number;
  fields: BattlefieldType[];
  enemies: NodeEnemy[];
}

export interface GameNode {
  id: string;
  name: string;
  waves: NodeWave[];
}

export interface EnemyBase {
  id: string;
  name: string;
  attribute: string;
  traits: string[];
}

// ============================================================================
// 1. ESTRUTURAS DE ESTADO VIVO (ACTIVE STATES)
// ============================================================================

export interface ActiveEnemy {
  baseData: EnemyBase;       
  currentClass: ServantClass; 
  currentHp: number;          
  maxHp: number;              
  activeBuffs: any[]; 
}

export interface ActiveWaveState {
  waveNumber: number;         
  activeFields: BattlefieldType[]; 
  enemies: ActiveEnemy[];     
}

export interface ActiveNodeState {
  nodeId: string;             
  nodeName: string;           
  currentWaveIndex: number;   
  totalWaves: number;         
  activeWave: ActiveWaveState; 
  originalWavesData: NodeWave[]; 
}

// ============================================================================
// 2. FUNÇÕES GERENCIADORAS DO CÉREBRO DO NODE
// ============================================================================

/**
 * Pega um inimigo bruto da fase e o transforma em um objeto de combate "Vivo" (ActiveEnemy)
 */
export function createActiveEnemy(nodeEnemy: NodeEnemy): ActiveEnemy | null {
  let baseEnemy: EnemyBase | undefined;

  // 1. Se for um monstro comum mapeado no DBEnemies.json
  if (nodeEnemy.enemyBaseId) {
    // 🌟 CORREÇÃO: Tipagem explícita (e: any) adicionada para limpar o erro do .find()
    baseEnemy = (EnemiesData.enemies || []).find((e: any) => e.id === nodeEnemy.enemyBaseId);
  } 
  // 2. Se for um Servo vindo do DBServants (Deixamos engatilhado para quando criar o DBServants.json)
  else if (nodeEnemy.id) {
    // Por enquanto, se for um servo e não tiver o arquivo criado, criamos um mock rápido para não quebrar a tela
    baseEnemy = {
      id: nodeEnemy.id,
      name: `Servant Enemy (${nodeEnemy.id})`,
      attribute: "Sky",
      traits: ["Humanoid"]
    };
  }

  // Se não encontrar em nenhum lugar, avisa no terminal
  if (!baseEnemy) {
    console.log("❌ ERRO: Não achei o inimigo no banco de dados!");
    console.log("Buscando por:", nodeEnemy.enemyBaseId || nodeEnemy.id);
    return null;
  }

  // Retorna a estrutura clonada combinando as Traits base com possíveis extras
  return {
    baseData: {
      ...baseEnemy,
      // Se você colocou extraTraits no JSON do Node, elas se fundem aqui usando um fallback amigável
      traits: baseEnemy.traits.concat((nodeEnemy as any).extraTraits || [])
    },
    currentClass: nodeEnemy.customClass, 
    currentHp: nodeEnemy.customHp,       
    maxHp: nodeEnemy.customHp,          
    activeBuffs: [] 
  };
}

/**
 * Pega os dados brutos de uma horda inteira e monta o estado vivo dela
 */
export function initWaveState(nodeWaveData: NodeWave): ActiveWaveState {
  const activeEnemiesList = nodeWaveData.enemies
    .map(e => createActiveEnemy(e)) 
    .filter((e): e is ActiveEnemy => e !== null); 

  if (activeEnemiesList.length === 0) {
    console.warn("Aviso: Wave iniciada sem inimigos!");
  }
  
  if (activeEnemiesList.length > 6) {
    console.error("Erro Crítico: Limite máximo de 6 inimigos excedido!");
    activeEnemiesList.splice(6); 
  }

  return {
    waveNumber: nodeWaveData.waveNumber,      
    activeFields: [...nodeWaveData.fields], 
    enemies: activeEnemiesList               
  };
}

/**
 * FUNÇÃO PRINCIPAL: Localiza a fase dentro do array de nodes do seu JSON e inicia a sessão
 */
export function startNodeSession(nodeId: string): ActiveNodeState | null {
  // 🌟 CORREÇÃO: Tipagem explícita (n: any) adicionada para limpar o erro do .find()
  const foundNode = (NodesData.nodes || []).find((n: any) => n.id === nodeId);
  
  if (!foundNode) return null;

  // Realizamos um cast amigável para NodeWave para garantir compatibilidade com a tupla restritiva
  const firstWaveData = foundNode.waves[0] as NodeWave;
  const initialWaveState = initWaveState(firstWaveData);

  return {
    nodeId: foundNode.id,                 
    nodeName: foundNode.name,             
    currentWaveIndex: 0,                  
    totalWaves: foundNode.waves.length,   
    activeWave: initialWaveState,          
    originalWavesData: foundNode.waves as NodeWave[] 
  };
}

export function advanceToNextWave(currentState: ActiveNodeState): ActiveNodeState {
  const nextIndex = currentState.currentWaveIndex + 1;
  
  if (nextIndex >= currentState.totalWaves) {
    console.log("Fim do Node alcançado!"); 
    return currentState; 
  }

  const nextWaveData = currentState.originalWavesData[nextIndex];
  
  return {
    ...currentState,                       
    currentWaveIndex: nextIndex,           
    activeWave: initWaveState(nextWaveData) 
  };
}

export function cloneActiveWaveState(currentWave: ActiveWaveState, label: string = "WaveGenericStart"): ActiveWaveState & { snapshotLabel: string } {
  const cloned = JSON.parse(JSON.stringify(currentWave));
  // Acopla a propriedade nomeada diretamente na cópia da wave
  Object.defineProperty(cloned, 'snapshotLabel', {
    value: label,
    writable: true,
    enumerable: true,
    configurable: true
  });
  return cloned;
}