import { withTransaction } from '@scriptflow/database';

export class ManageCrew {
  /**
   * Syncs assignments for a crew member within a scenario
   */
  public async syncAssignments(crewId: string, scenarioId: string, assignments: any[]): Promise<void> {
    await withTransaction(async (tx) => {
      // 1. Delete old assignments
      await tx.execute('DELETE FROM crew_assignments WHERE crew_id = $1 AND scenario_id = $2', [crewId, scenarioId]);
      
      // 2. Insert new assignments
      for (const assignment of assignments) {
        await tx.execute(
          'INSERT INTO crew_assignments (id, crew_id, scenario_id, scene_id) VALUES ($1, $2, $3, $4)',
          [
            `cra_${Math.random().toString(36).substr(2, 9)}`,
            crewId,
            scenarioId,
            assignment.scene_id
          ]
        );
      }
    });
  }

  /**
   * Save a crew member (insert or update) and assign them to characters atomically.
   */
  public async saveCrewMemberWithActorAssignments(
    crewData: any, 
    assignedCharacters: string[] | undefined,
    scenarioId: string
  ): Promise<any> {
    const { CrewRepository } = await import('@scriptflow/database');
    const { generateId } = await import('@scriptflow/core');
    const crewRepo = new CrewRepository();
    
    return await withTransaction(async (tx) => {
      let memberId = crewData.id;
      if (memberId) {
        // Update
        await crewRepo.update(memberId, crewData, tx);
      } else {
        // Insert
        memberId = generateId('crw');
        const newData = { ...crewData, id: memberId, scenario_id: scenarioId };
        await crewRepo.insert(newData, tx);
      }

      // Assign actors to characters atomically
      if (assignedCharacters !== undefined) {
        // Clear previous assignments for this actor in this scenario
        await tx.execute(
          'UPDATE characters SET actor_id = NULL WHERE actor_id = $1 AND scenario_id = $2', 
          [memberId, scenarioId]
        );
        
        // Add new assignments
        for (const charId of assignedCharacters) {
          await tx.execute(
            'UPDATE characters SET actor_id = $1 WHERE id = $2 AND scenario_id = $3', 
            [memberId, charId, scenarioId]
          );
        }
      }

      return { id: memberId, ...crewData };
    });
  }
}
