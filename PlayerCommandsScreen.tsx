import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Modal, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQueue, QueueProvider } from './QueueContext';
import { styles } from './PlayerCommndsSheets'; // 👈 Mudança feita aqui
import { executeTurnOrganizerStep } from './AppEmSI/BattleOrganizer';
import { ActiveServant, triggerSkillCooldown } from './AppEmSI/PartySetup';
import { ActiveNodeState } from './AppEmSI/NodeSetup';

function PlayerCommandsScreenContent() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [partyState, setPartyState] = useState<(ActiveServant | null)[]>(() => route.params?.partyCompleta || [null, null, null, null, null, null]);
  const [activeNode, setActiveNode] = useState<ActiveNodeState | undefined>(() => route.params?.activeNode);
  const { visualQueue, effectsQueue, selectedQueueId, setSelectedQueueId, addSkillToQueue, addNpToQueue, deleteSelected, clearQueue } = useQueue();

  React.useEffect(() => {
    if (route.params?.partyCompleta) {
      setPartyState(route.params.partyCompleta);
    }
    if (route.params?.activeNode) {
      setActiveNode(route.params.activeNode);
    }
    setCurrentStepIndex(0);
    clearQueue();
  }, [route.params?.partyCompleta, route.params?.activeNode]);

  const [npModalVisible, setNpModalVisible] = useState(false);
  const [allyModalVisible, setAllyModalVisible] = useState(false);
  const [enemyModalVisible, setEnemyModalVisible] = useState(false);
  
  const [pendingAction, setPendingAction] = useState<{
    type: 'SKILL' | 'NP';
    slotIndex: number;
    position?: 'S1' | 'S2' | 'S3';
    data: any;
  } | null>(null);

  const inspecionarDestinatariosDoEnvelope = (envelopeData: any): { precisaInimigo: boolean; precisaAliado: boolean } => {
    if (!envelopeData) return { precisaInimigo: false, precisaAliado: false };
    let precisaInimigo = false;
    let precisaAliado = false;

    const targetPrincipal = String(envelopeData.targetType || envelopeData.target || '').toUpperCase().trim();
    if (targetPrincipal === 'ST' || targetPrincipal === 'ONE_ENEMY' || targetPrincipal === 'SINGLE') {
      precisaInimigo = true;
    }

    const papeisAzuis = Array.isArray(envelopeData.effects) ? envelopeData.effects : [];
    papeisAzuis.forEach((papel: any) => {
      if (papel.target === 'one_enemy') precisaInimigo = true;
      if (papel.target === 'one_ally') precisaAliado = true;
    });

    const categoriasDeDano = Array.isArray(envelopeData.DamageCategory) ? envelopeData.DamageCategory : [];
    categoriasDeDano.forEach((dmg: any) => {
      const powerData = dmg.power || {};
      const targetDmg = String(powerData.target || dmg.target || '').toLowerCase().trim();
      if (targetDmg === 'one_enemy' || targetDmg === 'single' || targetDmg === 'st') {
        precisaInimigo = true;
      }
    });

    return { precisaInimigo, precisaAliado };
  };

  const getNpData = (slotIndex: number, defaultName: string) => {
    const servo = partyState[slotIndex];
    if (!servo) return { servantName: "Slot Vazio", npName: "---" };
    return {
      servantName: servo.baseData?.name || defaultName,
      npName: servo.baseData?.noblePhantasm?.nameNP || "Noble Phantasm"
    };
  };

  const aplicarCooldownNaRam = (slotIndex: number, position: 'S1' | 'S2' | 'S3') => {
    setPartyState(prevParty => {
      const updatedParty = [...prevParty];
      const servo = updatedParty[slotIndex];
      
      if (servo && servo.baseData && servo.baseData.personalSkills) {
        // Clonamos o servo e suas skills para não mutar o estado diretamente
        const updatedSkills = servo.baseData.personalSkills.map((skill: any) => {
          if (skill.slot === position) {
            // Se o baseCooldown não existir por algum motivo, usamos 5 como fallback
            const cooldownMaximo = skill.baseCooldown ?? 5; 
            return {
              ...skill,
              currentCooldown: cooldownMaximo // 🔢 Aqui o currentCooldown vira o baseCooldown de verdade
            };
          }
          return skill;
        });

        updatedParty[slotIndex] = {
          ...servo,
          baseData: {
            ...servo.baseData,
            personalSkills: updatedSkills
          }
        };
      }
      return updatedParty;
    });
  };

  const resetarCooldownNaRam = (slotIndex: number, position: string) => {
    setPartyState(prevParty => {
      const updatedParty = [...prevParty];
      const servo = updatedParty[slotIndex];
      
      if (servo && servo.baseData && servo.baseData.personalSkills) {
        const updatedSkills = servo.baseData.personalSkills.map((skill: any) => {
          if (skill.slot === position) {
            return {
              ...skill,
              currentCooldown: 0 // 🔄 Volta o cooldown para zero
            };
          }
          return skill;
        });

        updatedParty[slotIndex] = {
          ...servo,
          baseData: { ...servo.baseData, personalSkills: updatedSkills }
        };
      }
      return updatedParty;
    });
  };

  const handleSkillPress = (slotIndex: number, position: 'S1' | 'S2' | 'S3') => {
    // 🔒 TRAVA DE NP: Se houver um NP na fila visual, impede o clique na skill
    const temNpNaFila = visualQueue.some(item => item.type === 'NP');
    if (temNpNaFila) return;

    const servo = partyState[slotIndex];
    if (!servo) return; 
    const skillData = servo.baseData?.personalSkills?.find((s: any) => s.slot === position);
    if (!skillData || (skillData.currentCooldown && skillData.currentCooldown > 0)) return;

    const { precisaInimigo, precisaAliado } = inspecionarDestinatariosDoEnvelope(skillData);
    if (precisaAliado) {
      setPendingAction({ type: 'SKILL', slotIndex, position, data: skillData });
      setAllyModalVisible(true);
    } else if (precisaInimigo) {
      setPendingAction({ type: 'SKILL', slotIndex, position, data: skillData });
      setEnemyModalVisible(true);
    } else {
      aplicarCooldownNaRam(slotIndex, position);
      addSkillToQueue(slotIndex, position, skillData);
    }
  };

  const handleNpSelect = (slotIndex: number) => {
    const servo = partyState[slotIndex];
    if (!servo || !servo.baseData?.noblePhantasm) return;
    
    // 🔒 TRAVA DE GAUGE: Impede seleção de NP se menor que 100%
    if ((servo.currentNpGauge || 0) < 100) return;

    const noblePhantasm = servo.baseData.noblePhantasm;
    const { precisaInimigo, precisaAliado } = inspecionarDestinatariosDoEnvelope(noblePhantasm);
    if (precisaAliado) {
      setPendingAction({ type: 'NP', slotIndex, data: noblePhantasm });
      setAllyModalVisible(true);
    } else if (precisaInimigo) {
      setPendingAction({ type: 'NP', slotIndex, data: noblePhantasm });
      setNpModalVisible(false); 
      setEnemyModalVisible(true); 
    } else {
      addNpToQueue(slotIndex, noblePhantasm);
      setNpModalVisible(false);
    }
  };

  const handleAllyTargetSelect = (targetSlotIndex: number) => {
    if (!pendingAction) return;
    const { type, slotIndex, position, data } = pendingAction;
    if (type === 'SKILL') {
      aplicarCooldownNaRam(slotIndex, position!);
      addSkillToQueue(slotIndex, position!, data, targetSlotIndex);
    } else {
      addNpToQueue(slotIndex, data, targetSlotIndex); 
    }
    setAllyModalVisible(false);
    setPendingAction(null);
  };

  const handleEnemyTargetSelect = (targetEnemyIndex: number) => {
    if (!pendingAction) return;
    const { type, slotIndex, position, data } = pendingAction;
    if (type === 'SKILL') {
      aplicarCooldownNaRam(slotIndex, position!);
      addSkillToQueue(slotIndex, position!, data, undefined, targetEnemyIndex);
    } else {
      addNpToQueue(slotIndex, data, targetEnemyIndex);
    }
    setEnemyModalVisible(false);
    setPendingAction(null); 
  };

  const handleClearQueueAndUnlock = () => {
    // Varre toda a fila visual antes de apagá-la
    visualQueue.forEach(item => {
      if (item && item.type !== 'NP') {
        resetarCooldownNaRam(item.slotIndex, item.type);
      }
    });
    
    clearQueue();
    setCurrentStepIndex(0);
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      
      {/* CONTAINER ESQUERDO PRINCIPAL */}
      <View style={styles.leftMainContainer}>
        
        {/* FILA DE COMANDOS HORIZONTAL */}
        <View style={styles.queueWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.queueContainer}>
            {visualQueue.map((item) => {
              const isSelected = selectedQueueId === item.id;
              
              // 🎨 DEFINE A COR BASEADA NO SLOT DE ORIGEM DO COMANDO (slotIndex)
              const corDaFila = item.slotIndex === 0 
                ? styles.redSkill 
                : item.slotIndex === 1 
                ? styles.blueSkill 
                : styles.orangeSkill;

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedQueueId(isSelected ? null : item.id)}
                  style={[
                    styles.miniQueueIcon, 
                    corDaFila, // 👈 Aplica a cor do slot correspondente
                    isSelected && styles.miniQueueIconSelected
                  ]}
                >
                  <Text style={styles.miniQueueText}>
                    {item.type === 'NP' ? `👑 NP S${item.slotIndex + 1}` : ` ${item.type}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* CONTROLES ESTILO PILL (DELETE, CLEAR, NEXT) */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.pillButton, selectedQueueId ? styles.activeDeletePill : styles.disabledPill]}
            disabled={!selectedQueueId}
            onPress={() => {
            const itemParaDeletar = visualQueue.find(item => item.id === selectedQueueId);
                
                // Se for uma Skill (e não um NP), reseta o cooldown dela na RAM
                if (itemParaDeletar && itemParaDeletar.type !== 'NP') {
                  resetarCooldownNaRam(itemParaDeletar.slotIndex, itemParaDeletar.type); // item.type guarda 'S1', 'S2' ou 'S3'
                }
                
                deleteSelected(); // Deleta da fila global
              }}
            >
            <Text style={selectedQueueId ? styles.activeDeletePillText : styles.disabledPillText}>🗑 Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.pillButton, styles.darkPill]} onPress={handleClearQueueAndUnlock}>
            <Text style={styles.darkPillText}>☰ Clear</Text>
          </TouchableOpacity>

              {/*Modo 1 por vez ou modo a fila inteira*/}
          {/* 
          <TouchableOpacity 
            style={[styles.pillButton, effectsQueue.length > 0 ? styles.lightBluePill : styles.disabledPill]}
            disabled={effectsQueue.length === 0}
            onPress={() => {
              if (effectsQueue.length === 0) return;
              const resultado = executeTurnOrganizerStep(partyState, activeNode!, effectsQueue, currentStepIndex);
              setPartyState(resultado.updatedParty);
              setActiveNode(resultado.updatedNode);
              
              if (resultado.isFinished) {
                setCurrentStepIndex(0);
                handleClearQueueAndUnlock();
                const slotsQueUsaramNP = effectsQueue
                  .filter(efeito => efeito.type === 'NOBLE_PHANTASM_EXECUTE')
                  .map(efeito => efeito.sourceSlot)
                  .filter(idx => idx !== undefined && idx !== null);
                navigation.navigate('TeamSetup', { isFinished: true, partyAtualizada: resultado.updatedParty, nodeAtualizado: resultado.updatedNode, slotsQueUsaramNP: slotsQueUsaramNP });
              } else if (resultado.isFailed) {
                setCurrentStepIndex(0); 
                alert("⚠️ Not enough Damage or Fail");
              } else {
                setCurrentStepIndex(prev => prev + 1);
              }
            }}
          >
            <Text style={effectsQueue.length > 0 ? styles.lightBluePillText : styles.disabledPillText}>
              {effectsQueue.length > 0 ? `✓ Next (${currentStepIndex + 1}/${effectsQueue.length})` : '✓ Done'}
            </Text>
          </TouchableOpacity> */}
          <TouchableOpacity 
            style={[styles.pillButton, effectsQueue.length > 0 ? styles.lightBluePill : styles.disabledPill]}
            disabled={effectsQueue.length === 0}
            onPress={() => {
              if (effectsQueue.length === 0) return;

              let indexAtual = 0;
              let currentPartyState = partyState;
              let currentActiveNode = activeNode!;
              let resultadoFinal: any = null;

              // 🔄 Loop para ler e processar a fila inteira de uma só vez
              while (indexAtual < effectsQueue.length) {
                const resultado = executeTurnOrganizerStep(currentPartyState, currentActiveNode, effectsQueue, indexAtual);
                
                // Atualiza as referências locais para o próximo passo do loop ler o estado mais recente
                currentPartyState = resultado.updatedParty;
                currentActiveNode = resultado.updatedNode;
                resultadoFinal = resultado;

                // Se houver falha ou a batalha terminar no meio do caminho, interrompe o loop imediatamente
                if (resultado.isFinished || resultado.isFailed) {
                  break;
                }

                indexAtual++;
              }

              // Aplica os estados finais calculados de uma só vez na tela
              setPartyState(currentPartyState);
              setActiveNode(currentActiveNode);
              setCurrentStepIndex(0);

              // Trata o desfecho da execução total da fila
              if (resultadoFinal?.isFinished) {
                handleClearQueueAndUnlock();
                const slotsQueUsaramNP = effectsQueue
                  .filter(efeito => efeito.type === 'NOBLE_PHANTASM_EXECUTE')
                  .map(efeito => efeito.sourceSlot)
                  .filter(idx => idx !== undefined && idx !== null);
                
                navigation.navigate('TeamSetup', { 
                  isFinished: true, 
                  partyAtualizada: currentPartyState, 
                  nodeAtualizado: currentActiveNode, 
                  slotsQueUsaramNP: slotsQueUsaramNP 
                });
              } else if (resultadoFinal?.isFailed) {
                alert("⚠️ Not enough Damage or Fail");
              } else {
                // Caso a fila tenha sido toda processada e não disparou finish/fail (fim do turno comum), limpa a fila
                handleClearQueueAndUnlock();
              }
            }}
          >
            <Text style={effectsQueue.length > 0 ? styles.lightBluePillText : styles.disabledPillText}>
              ✓ Done
            </Text>
          </TouchableOpacity>
        </View>

        {/* ROW DOS SERVOS */}
        <View style={styles.servantsRow}>
          {[0, 1, 2].map((idx) => {
            const servo = partyState[idx];
            
            if (!servo) {
              return (
                <View key={idx} style={styles.servantBlock}>
                  <View style={styles.gaugeBlockContainer}>
                    <View style={styles.gaugeBlockSpacer} />
                  </View>
                  <Text style={styles.servantLabel}>[ Vazio ]</Text>
                </View>
              );
            }

            return (
              <View key={idx} style={styles.servantBlock}>
                {/* GRUPO DE BARRAS HP / NP OUTLINE */}
                <View style={styles.gaugeBlockContainer}>
                  <View style={styles.hpGaugeOutline}>
                    <Text style={styles.gaugeText}>HP: {servo.currentHp}/{servo.maxHp}</Text>
                  </View>
                  <View style={styles.npGaugeOutline}>
                    <Text style={styles.gaugeText}>NP: {servo.currentNpGauge ?? 0}%</Text>
                  </View>
                </View>

                {/* QUADRADOS DE SKILL (S1, S2, S3) */}
                  <View style={styles.skillsContainer}>
                    {(['S1', 'S2', 'S3'] as const).map((pos, sIdx) => {
                      const skill = servo.baseData?.personalSkills?.find((s: any) => s.slot === pos);
                      const isOnCd = skill?.currentCooldown && skill.currentCooldown > 0;
                      
                      // Trava se houver um NP na fila visual
                      const bloqueadoPorNp = visualQueue.some(item => item.type === 'NP');
                      
                      // 🔒 NOVA REGRA DE TRAVA: Fica escuro/travado se estiver em Cooldown OU se houver NP na fila
                      const precisaTravarVisual = isOnCd || bloqueadoPorNp;

                      const corSkill = idx === 0 ? styles.redSkill : idx === 1 ? styles.blueSkill : styles.orangeSkill;

                      return (
                        <TouchableOpacity 
                          key={pos} 
                          style={[
                            styles.skillSquare, 
                            corSkill,
                            precisaTravarVisual && styles.skillSquareLocked // 👈 Aplica o estilo escuro se estiver em CD
                          ]}
                          onPress={() => handleSkillPress(idx, pos)}
                          disabled={!!precisaTravarVisual} // 👈 Desativa o clique completamente
                        >
                          {isOnCd ? (
                            // 🔢 CASO TRAVADA POR COOLDOWN: O texto muda para o valor do currentCooldown
                            <Text style={styles.cooldownNumberText}>{skill.currentCooldown}</Text>
                          ) : (
                            // CASO NORMAL: Mostra S1, S2 ou S3
                            <Text style={styles.skillText}>{pos}</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* LABEL DO SERVO (AGORA ABAIXO DAS SKILLS) */}
                  <Text style={styles.servantLabel} numberOfLines={1}>{servo.baseData?.name}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* BARRA LATERAL DIREITA */}
      <View style={styles.rightSidebar}>
        <View style={styles.masterSkillsButton}>
          <Text style={styles.masterSkillsText}>MASTER{"\n"}SKILLS</Text>
        </View>
        
        <TouchableOpacity style={styles.attackButton} onPress={() => setNpModalVisible(true)}>
          <Text style={styles.attackText}>ATTACK</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL ALIADO */}
      <Modal visible={allyModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione o Alvo Aliado</Text>
            {[0, 1, 2].map((idx) => (
              <TouchableOpacity key={idx} style={[styles.targetButton, styles.darkPill]} onPress={() => handleAllyTargetSelect(idx)}>
                <Text style={styles.targetButtonText}>{getNpData(idx, `Servant ${idx + 1}`).servantName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* MODAL INIMIGO */}
      <Modal visible={enemyModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione o Alvo Inimigo</Text>
            <ScrollView style={{ width: '100%' }}>
              {activeNode?.activeWave?.enemies?.map((enemy: any, index: number) => (
                <TouchableOpacity key={index} style={[styles.targetButton, styles.darkPill, { marginBottom: 8 }]} onPress={() => handleEnemyTargetSelect(index)}>
                  <Text style={styles.targetButtonText}>[{index + 1}] {enemy.baseData?.name} - HP: {enemy.currentHp}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL NOBLE PHANTASM */}
      <Modal 
        visible={npModalVisible} 
        transparent 
        animationType="fade"
        onRequestClose={() => setNpModalVisible(false)} // 📱 Fecha ao apertar o botão 'Back' do celular
      >
        {/* Usamos esse wrapper para detectar o clique fora da caixinha de conteúdo */}
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setNpModalVisible(false)} // 🔲 Fecha ao clicar no fundo escuro (fora do modal)
        >
          {/* O stopPropagation impede que o clique de fechar seja acionado ao clicar dentro da caixinha */}
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Noble Phantasm Deck</Text>
            {[0, 1, 2].map((idx) => {
              const servo = partyState[idx];
              const naoPronto = !servo || (servo.currentNpGauge || 0) < 100;
              const corBotao = idx === 0 ? styles.redButton : idx === 1 ? styles.blueButton : styles.orangeButton;

              return (
                <TouchableOpacity 
                  key={idx} 
                  disabled={naoPronto} 
                  style={[styles.npButton, corBotao, naoPronto && styles.npButtonDisabled]} 
                  onPress={() => handleNpSelect(idx)}
                >
                  <Text style={styles.npServantText}>{getNpData(idx, '').servantName}</Text>
                  <Text style={styles.npNameText}>{getNpData(idx, '').npName}</Text>
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export default function PlayerCommandsScreen(props: any) {
  return (
    <QueueProvider>
      <PlayerCommandsScreenContent {...props} />
    </QueueProvider>
  );
}