import { useCallback } from 'react';
import { generateId } from '@scriptflow/core';

export function useRelationshipActions(
  scenarioId: string | undefined | null,
  _rawGraphData: React.MutableRefObject<any>,
  setErrorModalMessage: (msg: any) => void,
  loadGraph: () => Promise<void>
) {

  const addRelationship = useCallback(async (
    partner1: string | number,
    partner2: string | number,
    relType: string,
    isBypass: boolean = false,
    actionParams: any = null
  ): Promise<boolean> => {
    const p1 = isBypass ? actionParams.partner1 : partner1;
    const p2 = isBypass ? actionParams.partner2 : partner2;
    const rType = isBypass ? actionParams.relType : relType;

    if (!p1 || !p2 || !rType || !scenarioId) return false;

    try {
      const { CharacterRelationshipRepository } = await import('@scriptflow/database');
      const relRepo = new CharacterRelationshipRepository();
      await relRepo.insert({
        id: generateId('rel'),
        scenario_id: scenarioId,
        character_id: String(p1),
        partner_id: String(p2),
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

  const addManualDramaticRelationship = useCallback(async (
    source: string | number,
    target: string | number,
    manualLinkLabel: string
  ): Promise<boolean> => {
    if (!scenarioId) return false;
    try {
      const { CharacterRelationshipRepository } = await import('@scriptflow/database');
      const relRepo = new CharacterRelationshipRepository();
      await relRepo.insert({
        id: generateId('rel'),
        scenario_id: scenarioId,
        character_id: String(source),
        partner_id: String(target),
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

  const removeRelationship = useCallback(async (edgeId: string | number): Promise<boolean> => {
    try {
      const { CharacterRelationshipRepository } = await import('@scriptflow/database');
      const relRepo = new CharacterRelationshipRepository();
      await relRepo.delete(String(edgeId));
      
      await loadGraph();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, [loadGraph]);

  const handleCoParentChoice = useCallback(async (
    coParentPopup: { source: string | number; target: string | number; [key: string]: any } | null,
    choiceType: string
  ): Promise<boolean> => {
    if (!coParentPopup || !scenarioId) return false;
    try {
      const { CharacterRelationshipRepository } = await import('@scriptflow/database');
      const relRepo = new CharacterRelationshipRepository();
      await relRepo.insert({
        id: generateId('rel'),
        scenario_id: scenarioId,
        character_id: String(coParentPopup.source),
        partner_id: String(coParentPopup.target),
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
