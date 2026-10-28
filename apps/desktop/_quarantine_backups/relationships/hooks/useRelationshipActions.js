import { useCallback } from 'react';
import { generateId } from '@scriptflow/core';


export function useRelationshipActions(scenarioId, rawGraphData, setErrorModalMessage, loadGraph) {

  const addRelationship = useCallback(async (partner1, partner2, relType, isBypass = false, actionParams = null) => {
    const p1 = isBypass ? actionParams.partner1 : partner1;
    const p2 = isBypass ? actionParams.partner2 : partner2;
    const rType = isBypass ? actionParams.relType : relType;

    if (!p1 || !p2 || !rType) return false;

    try {
      const reqBody = { character_id: p1, partner_id: p2, relationship_type: rType, category: 'BIOLOGICAL' };
      if (isBypass) {
        reqBody.skip_validation = true;
      }

      const { CharacterRelationshipRepository } = await import('@scriptflow/database');
      const relRepo = new CharacterRelationshipRepository();
      await relRepo.insert({
        id: generateId('rel'),
        scenario_id: scenarioId,
        character_id: p1,
        partner_id: p2,
        relationship_type: rType,
        relationship_category: 'BIOLOGICAL'
      });

      if (isBypass) setErrorModalMessage(null);
      await loadGraph();
      return true;
    } catch (err) {
      console.error(err);
      setErrorModalMessage({ message: 'تعذر الاتصال بالخادم. يرجى المحاولة لاحقاً.' });
      return false;
    }
  }, [scenarioId, loadGraph, setErrorModalMessage]);

  const addManualDramaticRelationship = useCallback(async (source, target, manualLinkLabel) => {
    try {
      const { CharacterRelationshipRepository } = await import('@scriptflow/database');
      const relRepo = new CharacterRelationshipRepository();
      await relRepo.insert({
        id: generateId('rel'),
        scenario_id: scenarioId,
        character_id: source,
        partner_id: target,
        relationship_type: manualLinkLabel,
        relationship_category: 'DRAMATIC'
      });
      
      await loadGraph();
      return true;
    } catch (err) {
      console.error(err);
      setErrorModalMessage({ message: 'تعذر الاتصال بالخادم' });
      return false;
    }
  }, [scenarioId, loadGraph, setErrorModalMessage]);

  const removeRelationship = useCallback(async (edgeId) => {
    try {
      const { CharacterRelationshipRepository } = await import('@scriptflow/database');
      const relRepo = new CharacterRelationshipRepository();
      await relRepo.delete(edgeId);
      
      await loadGraph();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, [scenarioId, loadGraph]);

  const handleCoParentChoice = useCallback(async (coParentPopup, choiceType) => {
    if (!coParentPopup) return false;
    try {
      const { CharacterRelationshipRepository } = await import('@scriptflow/database');
      const relRepo = new CharacterRelationshipRepository();
      await relRepo.insert({
        id: generateId('rel'),
        scenario_id: scenarioId,
        character_id: coParentPopup.source,
        partner_id: coParentPopup.target,
        relationship_type: choiceType,
        relationship_category: 'BIOLOGICAL'
      });
      
      await loadGraph();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }, [scenarioId, loadGraph]);

  return {
    addRelationship,
    addManualDramaticRelationship,
    removeRelationship,
    handleCoParentChoice
  };
}
