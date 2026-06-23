import React, { useState } from "react";
import { View, Text, Platform, FlatList, TouchableOpacity, Modal, TouchableWithoutFeedback, ScrollView, Switch } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native"; 

import { styles, modalStyles } from "./AppStyles";
import { PRE_MADE_COMPS_DB } from "./DataBase/DBcomps";       
import { CRAFT_ESSENCES_DB } from "./DataBase/DBcraftessences"; 

const ServantsData = require("./DataBase/DBServants.json");       
const NodesData = require("./DataBase/DBNodes.json");             
const EnemiesData = require("./DataBase/DBEnemies.json");

import { loadPartyFromComp, createActiveServant, ActiveServant, PartySlots, validatePartySelection, getMaxNpGauge as getGaugeRule, clonePartyState } from "./AppEmSI/PartySetup";
import { startNodeSession, ActiveNodeState, ActiveWaveState, cloneActiveWaveState } from "./AppEmSI/NodeSetup";
import { initializeServantEffects } from './AppEmSI/EffectProcessor';
import { advancePartyTurnState } from "./AppEmSI/BattleOrganizer"; // Ajuste o caminho se necessário

interface WaveReport {
  waveIndex: number;
  npsUsados?: string[]; 
  waveNumber: number;
  totalDamage: number;
  refunds: Array<{ servantName: string; finalGauge: number }>;
  slotsQueUsaramNP: number[]; 
}

// Persistência global estrita para os relatórios de texto imutáveis
let MEMORIA_GLOBAL_WAVE_REPORTS: WaveReport[] = [];

export default function TeamSetupScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [waveReports, setWaveReports] = useState<WaveReport[]>(() => [...MEMORIA_GLOBAL_WAVE_REPORTS]);
  const [nodeOriginal, setNodeOriginal] = useState<ActiveNodeState | null>(null);
  
  const [selectedCompId, setSelectedCompId] = useState("");
  const [partyOriginal, setPartyOriginal] = useState<PartySlots>([null, null, null, null, null, null]);
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [partyModalVisible, setPartyModalVisible] = useState(false); 

  React.useEffect(() => {
    if (route.params?.partyAtualizada) {
          const partyVindaDaBatalha = route.params.partyAtualizada as PartySlots;
          
          // Aplica o -1 nos cooldowns e limpa os buffs zerados
          const partyProntaParaProximaWave = advancePartyTurnState(partyVindaDaBatalha);
          
          // Força a tipagem na atribuição caso o state seja rígido
          setPartyOriginal(partyProntaParaProximaWave as PartySlots);
        }
    
    if (route.params?.nodeAtualizado) {
      const nodeVindoDaBatalha = JSON.parse(JSON.stringify(route.params.nodeAtualizado)) as ActiveNodeState;
      
      // Só processa se a flag de finalização estiver explicitamente ativa
      // Dentro do useEffect do TeamSetupScreen.tsx...
      if (route.params?.isFinished === true) {
        const waveOriginalInfo = nodeVindoDaBatalha.activeWave;
        const waveNumberFinalizada = waveOriginalInfo.waveNumber;
        
        const waveOriginalDoBanco = nodeVindoDaBatalha.originalWavesData.find(w => w.waveNumber === waveNumberFinalizada);
        
        let totalDamageCalculated = 0;
        if (waveOriginalDoBanco) {
          waveOriginalDoBanco.enemies.forEach((enemyOriginal, eIdx) => {
            const enemyVivoState = nodeVindoDaBatalha.activeWave.enemies[eIdx];
            const currentHp = enemyVivoState ? enemyVivoState.currentHp : 0;
            const damageOnThisEnemy = Math.max(0, enemyOriginal.customHp - currentHp);
            totalDamageCalculated += damageOnThisEnemy;
          });
        }

        // 🎯 O REFUND SE BASEIA NA PARTY PARIDA DA BATALHA (ANTES de reduzir cooldown/buffs)
        const currentRefunds: Array<{ servantName: string; finalGauge: number }> = [];
        if (route.params?.partyAtualizada) {
          const partyForRefund = route.params.partyAtualizada as PartySlots;
          partyForRefund.slice(0, 3).forEach((slot) => {
            if (slot) {
              currentRefunds.push({
                servantName: slot.baseData?.name || "Unknown",
                finalGauge: slot.currentNpGauge || 0
              });
            }
          });
        }

        const npsDisparados = route.params?.slotsQueUsaramNP || [];
        const nomesDosServantsNP = route.params?.servantsQueUsaramNP || [];

        const novoRelatorio: WaveReport = {
          waveIndex: Number(nodeVindoDaBatalha.currentWaveIndex),
          waveNumber: Number(waveNumberFinalizada),
          totalDamage: Number(totalDamageCalculated),
          refunds: JSON.parse(JSON.stringify(currentRefunds)),
          slotsQueUsaramNP: [...npsDisparados],
          npsUsados: [...nomesDosServantsNP]
        };

        const indexExistente = MEMORIA_GLOBAL_WAVE_REPORTS.findIndex(r => r.waveNumber === novoRelatorio.waveNumber);
        if (indexExistente !== -1) {
          MEMORIA_GLOBAL_WAVE_REPORTS[indexExistente] = novoRelatorio;
        } else {
          MEMORIA_GLOBAL_WAVE_REPORTS.push(novoRelatorio);
        }

        setWaveReports([...MEMORIA_GLOBAL_WAVE_REPORTS]);

        // 🌟 ATUALIZAÇÃO DO SEU TIME PARA A PRÓXIMA WAVE:
        // Atualizamos a "partyOriginal" com os dados de quem lutou, mas já aplicando o decréscimo de turnos/buffs para a Wave 2
        if (route.params?.partyAtualizada) {
          const partyVindaDaBatalha = route.params.partyAtualizada as PartySlots;
          
          // Aplica o -1 nos cooldowns e limpa os buffs zerados
          const partyProntaParaProximaWave = advancePartyTurnState(partyVindaDaBatalha);
          
          // Salva no estado local da tela. Agora o card e o modal "Party Info" vão ler esses valores atualizados!
          setPartyOriginal(partyProntaParaProximaWave);
        }

        const currentWaveIdxNoBanco = nodeVindoDaBatalha.originalWavesData.findIndex(w => w.waveNumber === waveNumberFinalizada);
        const nextIndex = currentWaveIdxNoBanco + 1;
        
        // ... (o resto do seu código que monta os inimigos da próxima wave segue igual)
        
        if (nextIndex < nodeVindoDaBatalha.totalWaves) {
          const nextWaveData = nodeVindoDaBatalha.originalWavesData[nextIndex];
          
          const nextWaveStateEnemies = nextWaveData.enemies.map(e => ({
            id: e.id || `enemy_${Math.random().toString(36).substr(2, 4)}`,
            enemyBaseId: e.enemyBaseId || e.id,
            currentHp: e.customHp,
            maxHp: e.customHp,
            currentClass: e.customClass,
            baseData: { id: e.enemyBaseId || e.id || "", name: "Inimigo", attribute: "", traits: [] },
            activeBuffs: []
          }));

          setNodeOriginal({
            ...nodeVindoDaBatalha,
            currentWaveIndex: nextIndex,
            activeWave: {
              waveNumber: nextWaveData.waveNumber,
              activeFields: nextWaveData.fields,
              enemies: nextWaveStateEnemies
            }
          });
        } else {
          setNodeOriginal({
            ...nodeVindoDaBatalha,
            currentWaveIndex: nodeVindoDaBatalha.totalWaves 
          });
        }

        // 🌟 CORREÇÃO CRUCIAL: Limpa a flag de finalização da rota para evitar overwrites futuros
        navigation.setParams({ isFinished: false, nodeAtualizado: null });
      } else if (route.params?.isFinished === false && nodeOriginal === null) {
        // Só aceita o node vindo da rota se não tivermos uma sessão de avanço ativa rodando localmente
        setNodeOriginal(nodeVindoDaBatalha);
      }
    }
  }, [route.params?.partyAtualizada, route.params?.nodeAtualizado, route.params?.isFinished]);

  const updatePartyAndResetNode = (newParty: PartySlots) => {
    setPartyOriginal(newParty);
    if (nodeOriginal && !route.params?.nodeAtualizado) {
      setNodeOriginal(null);
      setSelectedNodeId("");
      MEMORIA_GLOBAL_WAVE_REPORTS = []; 
      setWaveReports([]); 
    }
  };
  
  const handleCompChange = (compId: string) => {
    setSelectedCompId(compId);
    const loadedParty = loadPartyFromComp(compId);
    updatePartyAndResetNode(loadedParty);
  };

  const handleSlotServantChange = (slotIndex: number, servantId: string) => {
    if (servantId === "") {
      const updatedParty = [...partyOriginal] as PartySlots;
      updatedParty[slotIndex] = null;
      updatePartyAndResetNode(updatedParty);
      return;
    }

    const isValid = validatePartySelection(partyOriginal, slotIndex, servantId);
    if (!isValid) return;

    const updatedParty = [...partyOriginal] as PartySlots;
    const currentCeId = updatedParty[slotIndex]?.equippedCE?.id || null;
    updatedParty[slotIndex] = createActiveServant(servantId, currentCeId);
    updatePartyAndResetNode(updatedParty);
  };

  const handleSlotCeChange = (slotIndex: number, ceId: string) => {
    const updatedParty = [...partyOriginal] as PartySlots;
    const currentSlot = updatedParty[slotIndex];

    if (currentSlot) {
      const servantId = currentSlot.baseData?.id || "";
      updatedParty[slotIndex] = createActiveServant(servantId, ceId === "" ? null : ceId);
      
      if (updatedParty[slotIndex]) {
        updatedParty[slotIndex]!.npLevel = currentSlot.npLevel;
        updatedParty[slotIndex]!.maxNpGauge = currentSlot.maxNpGauge;
        updatedParty[slotIndex]!.skillLevels = [...currentSlot.skillLevels];
      }
    }
    updatePartyAndResetNode(updatedParty);
  };

  const handleNpLevelChange = (slotIndex: number, levelStr: string) => {
    const updatedParty = [...partyOriginal] as PartySlots;
    const slot = updatedParty[slotIndex];
    if (slot) {
      const level = parseInt(levelStr, 10);
      slot.npLevel = level;
      slot.maxNpGauge = getMaxReleaseGauge(level);
      updatePartyAndResetNode(updatedParty);
    }
  };

  const getMaxReleaseGauge = (level: number) => {
    try { return getGaugeRule(level); } catch { return 100; }
  };

  const handleSkillLevelChange = (slotIndex: number, skillIndex: number, levelStr: string) => {
    const updatedParty = [...partyOriginal] as PartySlots;
    const slot = updatedParty[slotIndex];
    if (slot) {
      const level = parseInt(levelStr, 10);
      slot.skillLevels[skillIndex] = level;
      updatePartyAndResetNode(updatedParty);
    }
  };

  const handleNodeChange = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    MEMORIA_GLOBAL_WAVE_REPORTS = []; 
    setWaveReports([]); 
    
    if (nodeId === '') {
      setNodeOriginal(null);
    } else {
      const session = startNodeSession(nodeId);
      setNodeOriginal(session);

      const updatedParty = partyOriginal.map((slot) => {
        if (!slot) return null;

        const servantResetado: ActiveServant = {
          ...slot,
          activeBuffs: [], 
          skillsCooldown: [...slot.skillsCooldown],
          skillLevels: [...slot.skillLevels]
        };

        if (slot.baseData && slot.baseData.classSkills && Array.isArray(slot.baseData.classSkills)) {
          slot.baseData.classSkills.forEach((skill: any) => {
            if (skill.effects && Array.isArray(skill.effects)) {
              skill.effects.forEach((effect: any) => {
                servantResetado.activeBuffs.push({
                  id: `classSkill_${skill.name || 'passive'}_${Math.random().toString(36).substr(2, 4)}`,
                  type: effect.type,
                  value: effect.value || 0,
                  durationTurns: 99,
                  durationAttacks: effect.durationAttacks || undefined
                });
              });
            }
          });
        }

        if (!slot.equippedCE) {
          return { ...servantResetado, currentNpGauge: 0 };
        }

        const fullyBuffedServant = initializeServantEffects(servantResetado, slot.equippedCE, false);

        const npChargeEffect = slot.equippedCE.effects?.find(
          (e: any) => e.effect && e.effect.type === 'npCharge'
        );

        const isMLB = !!(slot.equippedCE as any).isMLB; 
        const ceCharge = npChargeEffect ? (isMLB ? npChargeEffect.valueMLB : npChargeEffect.value) : 0;
        const tetoMaximoNP = slot.maxNpGauge;

        fullyBuffedServant.currentNpGauge = Math.min(0 + ceCharge, tetoMaximoNP);
        return fullyBuffedServant;
      }) as PartySlots;

      setPartyOriginal(updatedParty);
    }
  };

  const isFrontlineReady = partyOriginal[0] !== null && partyOriginal[1] !== null && partyOriginal[2] !== null;

  const UniversalPicker = ({ selectedValue, onValueChange, options, style }: any) => {
    const [modalVisible, setModalVisible] = useState(false);
    if (Platform.OS === 'web') {
      return (
        <select
          value={selectedValue}
          onChange={(e) => onValueChange(e.target.value)}
          style={{
            backgroundColor: "#222", color: "white", padding: 4, borderRadius: 4,
            border: "1px solid #444", fontSize: "12px", width: "100%", height: "32px",
            cursor: "pointer", textAlign: "center", textAlignLast: "center", ...style
          }}
        >
          {options.map((opt: any, idx: number) => (
            <option key={String(opt.value) + idx} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    }
    return (
      <View style={{ width: '100%' }}>
        <TouchableOpacity style={[styles.fallbackPicker, style]} onPress={() => setModalVisible(true)}>
          <Text style={{ color: '#fff', fontSize: 11, textAlign: 'center' }} numberOfLines={1}>
            {options.find((o: any) => o.value === selectedValue)?.label || "Select..."}
          </Text>
        </TouchableOpacity>
        <Modal visible={modalVisible} transparent={true} animationType="fade" onRequestClose={() => setModalVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={modalStyles.overlay}>
              <TouchableWithoutFeedback>
                <View style={modalStyles.modalContainer}>
                  <Text style={modalStyles.modalTitle}>Selecione uma opção</Text>
                  <FlatList
                    data={options}
                    keyExtractor={(item, index) => String(item.value) + index}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[modalStyles.optionButton, item.value === selectedValue && modalStyles.optionSelected]}
                        onPress={() => { onValueChange(item.value); setModalVisible(false); }}
                      >
                        <Text style={[modalStyles.optionText, item.value === selectedValue && modalStyles.optionTextSelected]}>
                          {item.label || "Opção sem nome"}
                        </Text>
                      </TouchableOpacity>
                    )}
                    style={{ maxHeight: 350 }}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    );
  };

  const skillLevelOptions = Array.from({ length: 10 }, (_, i) => ({ label: String(i + 1), value: String(i + 1), }));

  const renderSlotCard = (slot: any, index: number, isBackline: boolean) => {
    const currentServantId = slot ? slot.baseData?.id : "";
    const currentCeId = slot && slot.equippedCE ? slot.equippedCE.id : "";
    return (
      <View key={index} style={[styles.slotCard, slot ? (isBackline ? styles.slotBacklineFilled : styles.slotFilled) : styles.slotEmpty]}>
        <View style={styles.topSection}>
          <UniversalPicker
            selectedValue={currentServantId}
            onValueChange={(val: string) => handleSlotServantChange(index, val)}
            options={[
              { label: isBackline ? `[ Reserva ${index - 2} ]` : `[ Front ${index + 1} ]`, value: "" }, 
              ...((ServantsData as any).servants || []).map((s: any) => ({ label: s.name, value: s.id }))
            ]}
          />
        </View>
        <View style={styles.middleSection}>
          {slot ? (
            <>
              <Text style={styles.shortLabelText}>NP:</Text>
              <View style={styles.miniPickerWrapper}>
                <UniversalPicker
                  selectedValue={String(slot.npLevel)}
                  onValueChange={(val: string) => handleNpLevelChange(index, val)}
                  options={[{ label: "1", value: "1" }, { label: "2", value: "2" }, { label: "3", value: "3" }, { label: "4", value: "4" }, { label: "5", value: "5" }]}
                  style={styles.miniPickerStyle}
                />
              </View>
            </>
          ) : <Text style={styles.placeholderText}>—</Text>}
        </View>
        <View style={styles.skillsSection}>
          {slot ? slot.skillLevels.map((skillLevel: number, skillIdx: number) => (
            <View key={skillIdx} style={styles.skillRow}>
              <Text style={styles.shortLabelText}>S{skillIdx + 1}:</Text>
              <View style={styles.miniPickerWrapper}>
                <UniversalPicker
                  selectedValue={String(skillLevel)}
                  onValueChange={(val: string) => handleSkillLevelChange(index, skillIdx, val)}
                  options={skillLevelOptions}
                  style={styles.miniPickerStyle}
                />
              </View>
            </View>
          )) : <View style={{ alignItems: 'center' }}><Text style={styles.placeholderText}>—</Text></View>}
        </View>
        {slot && (
            <View style={styles.ceSection}>
              <View style={styles.miniDivider} />
              <UniversalPicker
                selectedValue={currentCeId}
                onValueChange={(val: string) => handleSlotCeChange(index, val)}
                options={[{ label: "[ Sem CE ]", value: "" }, ...CRAFT_ESSENCES_DB.map((ce) => ({ label: ce.name, value: ce.id }))]}
              />
              
            {currentCeId !== "" && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 0, marginBottom: -15, gap: 6 }}>
                <Text style={{ color: (slot.equippedCE as any)?.isMLB ? '#fbbf24' : '#64748b', fontSize: 11, fontWeight: 'bold' }}>
                  MLB :
                </Text>
                
                <Switch
                  trackColor={{ false: "#374151", true: "#d97706" }}
                  thumbColor={(slot.equippedCE as any)?.isMLB ? "#fbbf24" : "#94a3b8"}
                  ios_backgroundColor="#374151"
                  value={!!(slot.equippedCE as any)?.isMLB}
                  onValueChange={(newValue) => {
                    setPartyOriginal((prevParty) => {
                      const updatedParty = [...prevParty] as PartySlots;
                      const slotAtual = updatedParty[index];
                      
                      if (slotAtual && slotAtual.equippedCE) {
                        slotAtual.equippedCE = {
                          ...slotAtual.equippedCE,
                          isMLB: newValue
                        } as any;

                        const npChargeEffect = slotAtual.equippedCE?.effects?.find(
                          (e: any) => e.effect && e.effect.type === 'npCharge'
                        );
                        
                        const ceCharge = npChargeEffect 
                          ? (newValue ? (npChargeEffect.valueMLB || npChargeEffect.value) : npChargeEffect.value) 
                          : 0;

                        slotAtual.currentNpGauge = Math.min(ceCharge, slotAtual.maxNpGauge);
                      }
                      return updatedParty;
                    });
                  }}
                  style={Platform.OS === 'web' ? { transform: [{ scale: 0.75 }] } : { transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
                />
              </View>
            )}
            
            <View style={styles.miniDivider} />
          </View>
        )}
        <View style={styles.bottomSection}>
          <Text style={styles.statsText}>Atk: {slot ? slot.currentAtk : '—'}</Text>
          <Text style={styles.statsText}>HP: {slot ? slot.maxHp : '—'}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={[]} renderItem={null} keyboardShouldPersistTaps="handled" style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Escolha sua comp</Text>
            <View style={styles.pickerContainer}>
              <UniversalPicker
                selectedValue={selectedCompId} onValueChange={handleCompChange}
                options={[{ label: "Selecione uma composição...", value: "" }, ...PRE_MADE_COMPS_DB.map((comp) => ({ label: comp.name, value: comp.id }))]}
                style={styles.mainPickerStyle}
              />
            </View>

            <Text style={styles.sectionTitle}>Customização do Time (Arraste para o lado ↔)</Text>
            <ScrollView horizontal={true} pagingEnabled={Platform.OS !== 'web'} showsHorizontalScrollIndicator={true} style={styles.horizontalScroll}>
              <View style={styles.pageContainer}>
                <Text style={styles.pageIndicatorText}>LINHA DE FRENTE (CAMP)</Text>
                <View style={styles.slotsRow}>{partyOriginal.slice(0, 3).map((slot, idx) => renderSlotCard(slot, idx, false))}</View>
              </View>
              <View style={styles.pageContainer}>
                <Text style={[styles.pageIndicatorText, { color: "#a855f7" }]}>BANCO DE RESERVAS (BACKLINE)</Text>
                <View style={styles.slotsRow}>{partyOriginal.slice(3, 6).map((slot, idx) => renderSlotCard(slot, idx + 3, true))}</View>
              </View>
            </ScrollView>

            <View style={styles.divider} />
            <Text style={styles.title}>Farm Simulator</Text>
            
            {isFrontlineReady ? (
              <>
                <View style={styles.pickerContainer}>
                  <UniversalPicker
                    selectedValue={selectedNodeId} 
                    onValueChange={handleNodeChange}
                    options={[
                      { label: "Selecione um Node de Farm...", value: "" }, 
                      ...((NodesData as any).nodes || []).map((node: any) => ({
                        label: node.name, 
                        value: node.id
                      }))
                    ]}
                    style={styles.mainPickerStyle}
                  />
                </View>

                {nodeOriginal && (
                  <View style={styles.nodePreviewContainer}>
                    <Text style={styles.nodePreviewTitle}>Estrutura de Inimigos Carregada:</Text>
                    {nodeOriginal.originalWavesData.map((wave, waveIdx) => {
                      const reportDaWave = waveReports.find(r => r.waveNumber === wave.waveNumber);
                      
                      const isCurrentFocussedWave = nodeOriginal.currentWaveIndex === waveIdx;
                      const isWaveAlreadyCompleted = waveIdx < nodeOriginal.currentWaveIndex || !!reportDaWave;

                      return (
                        <View key={waveIdx} style={[styles.waveRow, { borderColor: isCurrentFocussedWave ? '#fbbf24' : '#374151', borderWidth: isCurrentFocussedWave ? 2 : 1, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, marginBottom: 12, overflow: 'hidden' }]}>
                          <Text style={[styles.waveLabel, { color: isCurrentFocussedWave ? '#fbbf24' : '#94a3b8' }]}>
                            Wave {wave.waveNumber} {isWaveAlreadyCompleted && "✅"}
                          </Text>
                                                                      
                          <View style={styles.waveContentContainer}>
                            <View style={styles.fieldBox}>
                              <Text style={styles.fieldBoxTitle}>Fields</Text>
                              {wave.fields && wave.fields.length > 0 ? wave.fields.map((field, fIdx) => (
                                <Text key={fIdx} style={styles.fieldText}>• {field}</Text>
                              )) : <Text style={styles.fieldText}>• None</Text>}
                            </View>
                            <View style={styles.enemiesCentralizedContainer}>
                              <View style={styles.enemyNamesList}>
                                {wave.enemies.map((enemy, enemyIdx) => {
                                  const targetId = enemy.enemyBaseId || enemy.id;
                                  
                                  let enemyHp = enemy.customHp || 0;
                                  if (isWaveAlreadyCompleted) {
                                    enemyHp = 0;
                                  } else if (isCurrentFocussedWave) {
                                    const activeSessionEnemy = nodeOriginal.activeWave?.enemies?.find(e => {
                                      const eId = (e as any)?.baseData?.id || (e as any)?.enemyBaseId || (e as any)?.id;
                                      return eId === targetId;
                                    });
                                    enemyHp = activeSessionEnemy ? activeSessionEnemy.currentHp : (enemy.customHp || 0);
                                  }

                                  const baseDbEnemy = ((EnemiesData as any).enemies || []).find((e: any) => e.id === targetId);
                                  const enemyName = baseDbEnemy?.name || "Inimigo Desconhecido";

                                  return (
                                    <View key={enemyIdx} style={styles.enemyCardBlock}>
                                      <Text style={styles.enemyNameTag}>{enemyName}</Text>
                                      <Text style={[styles.enemyHpText, { color: enemyHp === 0 ? '#ef4444' : '#4ade80' }]}>
                                        HP: {enemyHp.toLocaleString('pt-BR')}
                                      </Text>
                                    </View>
                                  );
                                })}
                              </View>
                            </View>
                          </View>

                          {/* O botão agora avança perfeitamente e renderiza só na Wave ativa real */}
                          {isCurrentFocussedWave && (
                            <View style={{ width: '100%', marginTop: 10 }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                                <TouchableOpacity 
                                  style={{ flex: 1, backgroundColor: '#374151', paddingVertical: 10, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#4b5563' }} 
                                  onPress={() => setPartyModalVisible(true)} 
                                >
                                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>📋 Party Info</Text>
                                </TouchableOpacity>
                              </View>

                              <TouchableOpacity 
                                style={styles.playerCommandsBtn}
                                onPress={() => {
                                  if (!nodeOriginal) return;
                                  const partyVivaEAtualizada = clonePartyState(partyOriginal);
                                  navigation.navigate("PlayerCommands", { 
                                    partyCompleta: partyVivaEAtualizada, 
                                    activeNode: nodeOriginal 
                                  });
                                }}
                              >
                                <Text style={styles.playerCommandsText}>Player Commands</Text>
                              </TouchableOpacity>
                            </View>
                          )}

                        {/* Bloquinho imutável de resultado de cada Wave */}
                        {(() => {
                          const repoDaWave = waveReports.find(r => r.waveNumber === wave.waveNumber);
                          if (!repoDaWave) return null;

                          return (
                            <View style={{ marginTop: 12, padding: 10, backgroundColor: '#111827', borderRadius: 6, borderWidth: 1, borderColor: '#1f2937' }}>
                              <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 12, marginBottom: 4 }}>
                                TURN RESULTS (WAVE {wave.waveNumber}):
                              </Text>
                              
                              <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '500' }}>
                                Total Damage Dealt: <Text style={{ color: '#f59e0b' }}>
                                  {repoDaWave.totalDamage.toLocaleString('pt-BR')}
                                </Text>
                              </Text>

                              <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '500', marginTop: 4 }}>
                                Total Refund :
                              </Text>
                              
                              {repoDaWave.refunds.map((ref, rIdx) => {
                                const usouNP = 
                                  repoDaWave.slotsQueUsaramNP?.includes(rIdx) || 
                                  repoDaWave.npsUsados?.includes(ref.servantName) || 
                                  false;

                                return (
                                  <Text 
                                    key={rIdx} 
                                    style={{ 
                                      color: usouNP ? '#38bdf8' : '#94a3b8', 
                                      fontSize: usouNP ? 13 : 12,            
                                      fontWeight: usouNP ? 'bold' : '400',   
                                      marginLeft: 8,
                                      marginTop: 2
                                    }}
                                  >
                                    • {ref.servantName}: <Text style={{ color: usouNP ? '#fbbf24' : '#3b82f6', fontWeight: 'bold' }}>{ref.finalGauge.toFixed(1)}%</Text>
                                  </Text>
                                );
                              })}
                            </View>
                          );
                        })()}
                          
                        </View>
                      );
                    })}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.blockedNodeBox}>
                <Text style={styles.blockedText}>⚠️ SIMULATOR LOCKED</Text>
                <Text style={styles.blockedSubText}>Fill your frontline first</Text>
              </View>
            )}
          </>
        }
      />

      {/* MODAL DE PARTY INFO */}
      <Modal 
        visible={partyModalVisible} 
        transparent={true} 
        animationType="slide" 
        onRequestClose={() => setPartyModalVisible(false)} 
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} activeOpacity={1} onPress={() => setPartyModalVisible(false)} />
          <View style={[modalStyles.modalContainer, { width: '90%', maxHeight: '75%', padding: 16, backgroundColor: '#111827', borderColor: '#374151', borderWidth: 1, borderRadius: 12, flexDirection: 'column' }]}>
            <Text style={[modalStyles.modalTitle, { color: '#fbbf24', marginBottom: 16, textAlign: 'center', fontWeight: 'bold', fontSize: 16 }]}>📋 Estado Atual da Party</Text>
            <ScrollView showsVerticalScrollIndicator={true} style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 16 }}>
              {partyOriginal.map((slot, idx) => {
                if (!slot) {
                  return (
                    <View key={idx} style={{ padding: 10, marginBottom: 8, backgroundColor: '#1f2937', borderRadius: 6, opacity: 0.5 }}>
                      <Text style={{ color: '#94a3b8', fontSize: 12 }}>[ Slot {idx + 1} ]: Vazio</Text>
                    </View>
                  );
                }
                const isBackline = idx >= 3;
                return (
                  <View key={idx} style={{ padding: 12, marginBottom: 10, backgroundColor: '#1f2937', borderRadius: 6, borderLeftWidth: 4, borderLeftColor: isBackline ? '#a855f7' : '#3b82f6' }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{slot.baseData?.name || "Unknown"}</Text>
                    <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>CE: <Text style={{ color: '#38bdf8' }}>{slot.equippedCE?.name || 'Nenhuma'}</Text></Text>
                    
                    {/* Atributos Básicos */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, backgroundColor: '#111827', padding: 6, borderRadius: 4 }}>
                      <Text style={{ color: '#fff', fontSize: 12 }}>ATK: <Text style={{ color: '#f59e0b', fontWeight: 'bold' }}>{slot.currentAtk?.toLocaleString('pt-BR') || '0'}</Text></Text>
                      <Text style={{ color: '#fff', fontSize: 12 }}>HP: <Text style={{ color: '#4ade80', fontWeight: 'bold' }}>{slot.currentHp?.toLocaleString('pt-BR') || '0'}/{slot.maxHp?.toLocaleString('pt-BR') || '0'}</Text></Text>
                      <Text style={{ color: '#fff', fontSize: 12 }}>NP: <Text style={{ color: '#eab308', fontWeight: 'bold' }}>{Math.floor(slot.currentNpGauge || 0)}%</Text></Text>
                    </View>

                    {/* 🌟 NOVA SEÇÃO: ESTADO DOS COOLDOWNS DAS SKILLS */}
                    <View style={{ flexDirection: 'row', gap: 20, marginTop: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                      {(['S1', 'S2', 'S3'] as const).map((pos) => {
                        const skillData = slot.baseData?.personalSkills?.find((s: any) => s.slot === pos);
                        const cdValue = skillData?.currentCooldown && skillData.currentCooldown > 0 ? skillData.currentCooldown : '-';
                        return (
                          <Text key={pos} style={{ color: '#fff', fontSize: 12 }}>
                            {pos}: <Text style={{ color: cdValue === '-' ? '#94a3b8' : '#f87171', fontWeight: 'bold' }}>{cdValue}</Text>
                          </Text>
                        );
                      })}
                    </View>

                    {/* SEÇÃO DE ACTIVE BUFFS PERSONALIZADA */}
                    <View style={{ marginTop: 6 }}>
                      <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: 'bold', marginBottom: 2 }}>Efeitos Ativos:</Text>
                      {slot.activeBuffs && slot.activeBuffs.length > 0 ? (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
                          {slot.activeBuffs.map((buff: any, bIdx: number) => {
                            const name = buff.name || buff.type || 'Buff';
                            const value = buff.value ? ` ${buff.value > 1 ? buff.value : (buff.value * 100).toFixed(0)}%` : '';
                            
                            let attacks = '';
                            const attackCount = buff.durationAttacks !== undefined ? buff.durationAttacks : buff.timesRemaining;
                            if (attackCount !== undefined && attackCount !== null) {
                              attacks = ` ${attackCount} attack${attackCount === 1 ? '' : 's'}`;
                            }
                            
                            // Flag para identificar se é um buff eterno/passiva (> 90 turnos ou sem duração)
                            const isPermanent = buff.durationTurns === undefined || buff.durationTurns === null || buff.durationTurns > 90;

                            let duration = '';
                            if (!isPermanent) {
                              const prefix = attacks ? ',' : '';
                              duration = `${prefix} ${buff.durationTurns} turn${buff.durationTurns === 1 ? '' : 's'}`;
                            }

                            const stringDoBuff = `${name}${value}${attacks}${duration}`;
                            const isLast = bIdx === (slot.activeBuffs?.length || 0) - 1;

                            // Se for permanente (> 90), renderiza dentro do quadradinho individual
                            if (isPermanent) {
                              return (
                                <View 
                                  key={bIdx} 
                                  style={{ 
                                    backgroundColor: '#111827', 
                                    paddingHorizontal: 6, 
                                    paddingVertical: 2, 
                                    borderRadius: 4, 
                                    borderColor: '#4b5563', 
                                    borderWidth: 1,
                                    marginRight: 4,
                                    marginBottom: 2
                                  }}
                                >
                                  <Text style={{ color: '#38bdf8', fontSize: 12 }}>
                                    {stringDoBuff}
                                  </Text>
                                </View>
                              );
                            }

                            // Se for buff temporário comum, renderiza com o separador " | "
                            return (
                              <Text key={bIdx} style={{ color: '#38bdf8', fontSize: 12, marginBottom: 2 }}>
                                {stringDoBuff}{!isLast ? <Text style={{ color: '#64748b' }}>  |  </Text> : ''}
                              </Text>
                            );
                          })}
                        </View>
                      ) : (
                        <Text style={{ color: '#64748b', fontSize: 11, fontStyle: 'italic' }}>Nenhum efeito ativo</Text>
                      )}
                    </View>

                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}