// @ts-nocheck
import { 
  withTransaction, 
  ScenarioRepository, 
  EpisodeRepository, 
  CrewRepository, 
  CharacterRepository, 
  LocationRepository, 
  LocationImageRepository, 
  ShootDayRepository, 
  SceneRepository, 
  ScriptBlockRepository, 
  SceneCharacterRepository, 
  CharacterRelationshipRepository, 
  ProductionTaskRepository, 
  CrewAssignmentRepository,
  TransactionContext
} from '@scriptflow/database';
import { ImportOptions, ImportResult, MediaProcessor } from './Types.js';
import { validateImportPayload } from './Validator.js';
import { DomainError, ErrorCode } from '@scriptflow/core';

const genId = (prefix: string) => {
  let hex = '';
  try {
    hex = crypto.randomUUID().replace(/-/g, '');
  } catch (e) {
    hex = Math.random().toString(36).substring(2, 10);
  }
  const timeHex = Date.now().toString(36);
  const randomHex = Math.random().toString(36).substring(2, 6);
  return `${prefix}_${timeHex}${hex}${randomHex}`.substring(0, 48);
};

export class ImportProject {
  
  async checkConflict(jsonData: any) {
    const { scenario } = jsonData;
    if (!scenario || !scenario.id) return null;
    
    const repo = new ScenarioRepository();
    // Check by ID
    const byId = await repo.findById(scenario.id);
    if (byId) {
      return { type: 'ID_CONFLICT', existing: byId };
    }
    
    // Check by Title
    const byTitle = await repo.findAllBy('title', scenario.title);
    const activeByTitle = byTitle.filter(s => !s.deleted_at);
    if (activeByTitle.length > 0) {
      return { type: 'TITLE_CONFLICT', existing: activeByTitle[0] };
    }
    
    return null;
  }

  async execute(rawPayload: unknown, options: ImportOptions): Promise<ImportResult> {
    try {
      // 1. Validation Strategy
      const jsonData = validateImportPayload(rawPayload);
      
      const scenarioId = await withTransaction(async (tx: TransactionContext) => {
        return await this.performImport(jsonData, options, tx);
      });

      return {
        success: true,
        scenarioId
      };
    } catch (err: any) {
      console.error('Import failed:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }

  private async performImport(jsonData: any, options: ImportOptions, tx: TransactionContext): Promise<string> {
    const scenarioRepo = new ScenarioRepository();
    const epRepo = new EpisodeRepository();
    const crewRepo = new CrewRepository();
    const charRepo = new CharacterRepository();
    const locRepo = new LocationRepository();
    const locImgRepo = new LocationImageRepository();
    const shootDayRepo = new ShootDayRepository();
    const sceneRepo = new SceneRepository();
    const blockRepo = new ScriptBlockRepository();
    const scCharRepo = new SceneCharacterRepository();
    const charRelRepo = new CharacterRelationshipRepository();
    const taskRepo = new ProductionTaskRepository();
    const crewAssignRepo = new CrewAssignmentRepository();

    const mode = options.mode || 'COPY'; // 'COPY' | 'OVERWRITE' | 'MERGE'
    const conflictScenarioId = options.conflictScenarioId || null;

    const { 
      scenario, scenes, characters, locations, episodes, crew, 
      scene_characters, character_relationships, location_images 
    } = jsonData;
    
    if (!scenario) throw new Error('Invalid JSON format: missing scenario data');

    let newScenarioId: string;

    if (mode === 'OVERWRITE' && conflictScenarioId) {
      await scenarioRepo.clearScenarioContents(conflictScenarioId, tx);
      newScenarioId = conflictScenarioId;
    } else if ((mode === 'MERGE' || mode === 'OVERWRITE') && conflictScenarioId) {
      newScenarioId = conflictScenarioId;
    } else {
      newScenarioId = genId('prj');
    }

    // Process media files
    if (options.mediaProcessor) {
      try {
        await options.mediaProcessor.process(newScenarioId, scenario, [
          { field: 'cover_image', prefix: 'cover' },
          { field: 'cover_video', prefix: 'video' }
        ]);
        if (characters && Array.isArray(characters)) {
          await options.mediaProcessor.process(newScenarioId, characters, [
            { field: 'actor_photo', prefix: 'actor' }
          ]);
        }
        if (locations && Array.isArray(locations)) {
          await options.mediaProcessor.process(newScenarioId, locations, [
            { field: 'image', prefix: 'location' }
          ]);
        }
        if (crew && Array.isArray(crew)) {
          await options.mediaProcessor.process(newScenarioId, crew, [
            { field: 'image_url', prefix: 'crew' }
          ]);
        }
      } catch (err) {
        console.error('Failed to process media during import, falling back to database base64:', err);
      }
    }

    // Title resolution (only for new copies)
    let title = scenario.title || 'سيناريو مستورد';
    if (mode === 'COPY') {
      try {
        const existing = await tx.select('SELECT id FROM scenarios WHERE title = $1 AND deleted_at IS NULL LIMIT 1', [title]);
        if (existing && existing.length > 0) {
          const countRes = await tx.select<{count: number}>('SELECT COUNT(*) as count FROM scenarios WHERE title LIKE $1 AND deleted_at IS NULL', [`${title}%`]);
          const count = countRes[0]?.count || 1;
          title = `${title} (${count})`;
        }
      } catch (e) {
        console.error('Failed to check scenario title conflict:', e);
      }
    }

    // 1. Insert/Update Scenario
    if ((mode === 'MERGE' || mode === 'OVERWRITE') && conflictScenarioId) {
      await scenarioRepo.update(newScenarioId, {
        title: scenario.title || title,
        description: scenario.description || '',
        cover_image: scenario.cover_image || '',
        cover_video: scenario.cover_video || '',
        status: scenario.status || 'DRAFT',
        genre: scenario.genre || '',
        notes: scenario.notes || ''
      }, tx);
    } else {
      await scenarioRepo.insert({
        id: newScenarioId,
        title: title,
        description: scenario.description || '',
        cover_image: scenario.cover_image || '',
        cover_video: scenario.cover_video || '',
        status: scenario.status || 'DRAFT',
        genre: scenario.genre || '',
        notes: scenario.notes || ''
      }, tx);
    }

    // Maps to track ID transformation
    const episodeIdMap: Record<string, string> = {};
    const crewIdMap: Record<string, string> = {};
    const characterIdMap: Record<string, string> = {};
    const locationIdMap: Record<string, string> = {};
    const shootDaysIdMap: Record<string, string> = {};
    const sceneIdMap: Record<string, string> = {};

    // 2. Insert/Update Episodes
    if (episodes && Array.isArray(episodes)) {
      for (const ep of episodes) {
        let epIdToUse = ep.id;
        let isExisting = false;

        if (mode === 'MERGE') {
          const epById = await epRepo.findById(ep.id, tx);
          if (epById) {
            epIdToUse = ep.id;
            isExisting = true;
          } else {
            const existingEp = await tx.select<{id: string}>('SELECT id FROM episodes WHERE scenario_id = $1 AND episode_number = $2 LIMIT 1', [newScenarioId, ep.episode_number]);
            if (existingEp && existingEp.length > 0) {
              epIdToUse = existingEp[0].id;
              isExisting = true;
            }
          }
        } else if (mode === 'COPY') {
          epIdToUse = genId('ep');
        }

        episodeIdMap[ep.id] = epIdToUse;

        if (isExisting) {
          await epRepo.update(epIdToUse, {
            episode_number: ep.episode_number || 1,
            title: ep.title || '',
            description: ep.description || '',
            status: ep.status || 'DRAFT'
          }, tx);
        } else {
          await epRepo.insert({
            id: epIdToUse,
            scenario_id: newScenarioId,
            episode_number: ep.episode_number || 1,
            title: ep.title || '',
            description: ep.description || '',
            status: ep.status || 'DRAFT'
          }, tx);
        }
      }
    }

    // 3. Insert/Update Crew
    if (crew && Array.isArray(crew)) {
      for (const member of crew) {
        let crewIdToUse = member.id;
        let isExisting = false;

        if (mode === 'MERGE') {
          const crewById = await crewRepo.findById(member.id, tx);
          if (crewById) {
            crewIdToUse = member.id;
            isExisting = true;
          } else {
            const existingCrew = await tx.select<{id: string}>('SELECT id FROM crew WHERE scenario_id = $1 AND name = $2 LIMIT 1', [newScenarioId, member.name]);
            if (existingCrew && existingCrew.length > 0) {
              crewIdToUse = existingCrew[0].id;
              isExisting = true;
            }
          }
        } else if (mode === 'COPY') {
          crewIdToUse = genId('crw');
        }

        crewIdMap[member.id] = crewIdToUse;

        if (isExisting) {
          await crewRepo.update(crewIdToUse, {
            name: member.name || 'عضو جديد',
            role: member.role || 'ACTOR',
            category: member.category || 'TECHNICAL',
            image_url: member.image_url || '',
            phone: member.phone || '',
            email: member.email || '',
            contract_status: member.contract_status || 'PENDING',
            payment_status: member.payment_status || 'PENDING',
            wage: member.wage || 0.0,
            currency: member.currency || 'USD',
            employment_type: member.employment_type || 'FREELANCE',
            job_title: member.job_title || '',
            notes: member.notes || ''
          }, tx);
        } else {
          await crewRepo.insert({
            id: crewIdToUse,
            scenario_id: newScenarioId,
            name: member.name || 'عضو جديد',
            role: member.role || 'ACTOR',
            category: member.category || 'TECHNICAL',
            image_url: member.image_url || '',
            phone: member.phone || '',
            email: member.email || '',
            contract_status: member.contract_status || 'PENDING',
            payment_status: member.payment_status || 'PENDING',
            wage: member.wage || 0.0,
            currency: member.currency || 'USD',
            employment_type: member.employment_type || 'FREELANCE',
            job_title: member.job_title || '',
            notes: member.notes || ''
          }, tx);
        }
      }
    }

    // 4. Insert/Update Characters
    if (characters && Array.isArray(characters)) {
      for (const char of characters) {
        let charIdToUse = char.id;
        let isExisting = false;

        if (mode === 'MERGE') {
          const charById = await charRepo.findById(char.id, tx);
          if (charById) {
            charIdToUse = char.id;
            isExisting = true;
          } else {
            const existingChar = await tx.select<{id: string}>('SELECT id FROM characters WHERE scenario_id = $1 AND name = $2 AND deleted_at IS NULL LIMIT 1', [newScenarioId, char.name]);
            if (existingChar && existingChar.length > 0) {
              charIdToUse = existingChar[0].id;
              isExisting = true;
            }
          }
        } else if (mode === 'COPY') {
          charIdToUse = genId('chr');
        }

        characterIdMap[char.id] = charIdToUse;
        const mappedActorId = char.actor_id ? (crewIdMap[char.actor_id] || null) : null;
        const photo = char.actor_photo || '';

        if (isExisting) {
          await charRepo.update(charIdToUse, {
            name: char.name || 'شخصية جديدة',
            full_name: char.full_name || '',
            description: char.description || '',
            color: char.color || '#6366f1',
            age: char.age || '',
            role: char.role || '',
            gender: char.gender || 'MALE',
            status: char.status || 'SEARCHING',
            backstory: char.backstory || '',
            psychology: char.psychology || '',
            physical_traits: char.physical_traits || '',
            arc: char.arc || '',
            relationships: char.relationships || '',
            reference_images: char.reference_images || '[]',
            actor_name: char.actor_name || '',
            actor_photo: photo,
            phone: char.phone || '',
            email: char.email || '',
            actor_bio: char.actor_bio || '',
            actor_id: mappedActorId
          }, tx);
        } else {
          await charRepo.insert({
            id: charIdToUse,
            scenario_id: newScenarioId,
            name: char.name || 'شخصية جديدة',
            full_name: char.full_name || '',
            description: char.description || '',
            color: char.color || '#6366f1',
            age: char.age || '',
            role: char.role || '',
            gender: char.gender || 'MALE',
            status: char.status || 'SEARCHING',
            backstory: char.backstory || '',
            psychology: char.psychology || '',
            physical_traits: char.physical_traits || '',
            arc: char.arc || '',
            relationships: char.relationships || '',
            reference_images: char.reference_images || '[]',
            actor_name: char.actor_name || '',
            actor_photo: photo,
            phone: char.phone || '',
            email: char.email || '',
            actor_bio: char.actor_bio || '',
            actor_id: mappedActorId
          }, tx);
        }
      }
    }

    // 5. Insert/Update Locations
    if (locations && Array.isArray(locations)) {
      for (const loc of locations) {
        let locIdToUse = loc.id;
        let isExisting = false;

        if (mode === 'MERGE') {
          const locById = await locRepo.findById(loc.id, tx);
          if (locById) {
            locIdToUse = loc.id;
            isExisting = true;
          } else {
            const existingLoc = await tx.select<{id: string}>('SELECT id FROM locations WHERE scenario_id = $1 AND name = $2 AND deleted_at IS NULL LIMIT 1', [newScenarioId, loc.name]);
            if (existingLoc && existingLoc.length > 0) {
              locIdToUse = existingLoc[0].id;
              isExisting = true;
            }
          }
        } else if (mode === 'COPY') {
          locIdToUse = genId('loc');
        }

        locationIdMap[loc.id] = locIdToUse;

        if (isExisting) {
          await locRepo.update(locIdToUse, {
            name: loc.name || 'موقع جديد',
            type: loc.type || 'INT',
            address: loc.address || '',
            description: loc.description || '',
            image: loc.image || '',
            status: loc.status || 'AVAILABLE',
            map_url: loc.map_url || '',
            latitude: loc.latitude || 0,
            longitude: loc.longitude || 0,
            contact_name: loc.contact_name || '',
            contact_phone: loc.contact_phone || '',
            permit_status: loc.permit_status || 'NOT_REQUIRED',
            cost_per_day: loc.cost_per_day || 0.0,
            cost_currency: loc.cost_currency || 'USD',
            technical_notes: loc.technical_notes || ''
          }, tx);
        } else {
          await locRepo.insert({
            id: locIdToUse,
            scenario_id: newScenarioId,
            name: loc.name || 'موقع جديد',
            type: loc.type || 'INT',
            address: loc.address || '',
            description: loc.description || '',
            image: loc.image || '',
            status: loc.status || 'AVAILABLE',
            map_url: loc.map_url || '',
            latitude: loc.latitude || 0,
            longitude: loc.longitude || 0,
            contact_name: loc.contact_name || '',
            contact_phone: loc.contact_phone || '',
            permit_status: loc.permit_status || 'NOT_REQUIRED',
            cost_per_day: loc.cost_per_day || 0.0,
            cost_currency: loc.cost_currency || 'USD',
            technical_notes: loc.technical_notes || ''
          }, tx);
        }
      }
    }

    // 6. Insert/Update Location Images
    if (location_images && Array.isArray(location_images)) {
      for (const li of location_images) {
        const mappedLocId = li.location_id ? (locationIdMap[li.location_id] || null) : null;
        if (!mappedLocId) continue;
        const newLiId = genId('lim');

        await locImgRepo.insert({
          id: newLiId,
          location_id: mappedLocId,
          image_url: li.image_url || '',
          is_primary: li.is_primary || 0,
          sort_order: li.sort_order || 0
        }, tx);
      }
    }

    // 7. Insert/Update Shoot Days
    if (jsonData.shoot_days && Array.isArray(jsonData.shoot_days)) {
      for (const sd of jsonData.shoot_days) {
        let sdIdToUse = sd.id;
        let isExisting = false;

        if (mode === 'MERGE') {
          const sdById = await shootDayRepo.findById(sd.id, tx);
          if (sdById) {
            sdIdToUse = sd.id;
            isExisting = true;
          } else {
            const existingSd = await tx.select<{id: string}>('SELECT id FROM shoot_days WHERE scenario_id = $1 AND shoot_date = $2 LIMIT 1', [newScenarioId, sd.shoot_date]);
            if (existingSd && existingSd.length > 0) {
              sdIdToUse = existingSd[0].id;
              isExisting = true;
            }
          }
        } else if (mode === 'COPY') {
          sdIdToUse = genId('sd');
        }

        shootDaysIdMap[sd.id] = sdIdToUse;

        if (isExisting) {
          await shootDayRepo.update(sdIdToUse, {
            shoot_date: sd.shoot_date || '',
            start_time: sd.start_time || '',
            end_time: sd.end_time || '',
            status: sd.status || 'DRAFT',
            notes: sd.notes || ''
          }, tx);
        } else {
          await shootDayRepo.insert({
            id: sdIdToUse,
            scenario_id: newScenarioId,
            shoot_date: sd.shoot_date || '',
            start_time: sd.start_time || '',
            end_time: sd.end_time || '',
            status: sd.status || 'DRAFT',
            notes: sd.notes || ''
          }, tx);
        }
      }
    }

    // 8. Insert/Update Scenes & Blocks
    if (scenes && Array.isArray(scenes)) {
      for (const scene of scenes) {
        let sceneIdToUse = scene.id;
        let isExisting = false;

        const mappedEpisodeId = scene.episode_id ? (episodeIdMap[scene.episode_id] || null) : null;
        const mappedLocationId = scene.location_id ? (locationIdMap[scene.location_id] || null) : null;
        const mappedShootDayId = scene.shoot_day_id ? (shootDaysIdMap[scene.shoot_day_id] || null) : null;

        if (mode === 'MERGE') {
          const sceneById = await sceneRepo.findById(scene.id, tx);
          if (sceneById) {
            sceneIdToUse = scene.id;
            isExisting = true;
          } else {
            // Check by episode + scene_number
            const existingScene = await tx.select<{id: string}>('SELECT id FROM scenes WHERE scenario_id = $1 AND episode_id IS $2 AND scene_number = $3 AND deleted_at IS NULL LIMIT 1', [newScenarioId, mappedEpisodeId, scene.scene_number]);
            if (existingScene && existingScene.length > 0) {
              sceneIdToUse = existingScene[0].id;
              isExisting = true;
            }
          }
        } else if (mode === 'COPY') {
          sceneIdToUse = genId('scn');
        }

        sceneIdMap[scene.id] = sceneIdToUse;

        if (isExisting) {
          await sceneRepo.update(sceneIdToUse, {
            episode_id: mappedEpisodeId as any,
            location_id: mappedLocationId as any,
            shoot_day_id: mappedShootDayId as any,
            scene_number: scene.scene_number || 1,
            title: scene.title || '',
            description: scene.description || '',
            location_type: scene.location_type || 'INT',
            location_name: scene.location_name || '',
            time_of_day: scene.time_of_day || 'DAY',
            exact_time: scene.exact_time || '',
            weather: scene.weather || '',
            status: scene.status || 'DRAFT',
            revision_color: scene.revision_color || '',
            continuity: scene.continuity || '',
            time_shift: scene.time_shift || '',
            director_notes: scene.director_notes || '',
            extras_note: scene.extras_note || '',
            present_characters: scene.present_characters || '[]',
            planned_shoot_date: scene.planned_shoot_date || '',
            estimated_duration: scene.estimated_duration || '',
            page_eighths: scene.page_eighths || (scene.estimated_duration > 30 ? Math.round(scene.estimated_duration / 60) * 8 : 0),
            shoot_order: scene.shoot_order || 0
          }, tx);
        } else {
          await sceneRepo.insert({
            id: sceneIdToUse,
            scenario_id: newScenarioId,
            episode_id: mappedEpisodeId as any,
            location_id: mappedLocationId as any,
            shoot_day_id: mappedShootDayId as any,
            scene_number: scene.scene_number || 1,
            title: scene.title || '',
            description: scene.description || '',
            location_type: scene.location_type || 'INT',
            location_name: scene.location_name || '',
            time_of_day: scene.time_of_day || 'DAY',
            exact_time: scene.exact_time || '',
            weather: scene.weather || '',
            status: scene.status || 'DRAFT',
            revision_color: scene.revision_color || '',
            continuity: scene.continuity || '',
            time_shift: scene.time_shift || '',
            director_notes: scene.director_notes || '',
            extras_note: scene.extras_note || '',
            present_characters: scene.present_characters || '[]',
            planned_shoot_date: scene.planned_shoot_date || '',
            estimated_duration: scene.estimated_duration || '',
            page_eighths: scene.page_eighths || (scene.estimated_duration > 30 ? Math.round(scene.estimated_duration / 60) * 8 : 0),
            shoot_order: scene.shoot_order || 0
          }, tx);
        }

        // Script Blocks (clean & overwrite for this scene)
        await blockRepo.deleteAllBy('scene_id', sceneIdToUse, tx);
        if (scene.blocks && Array.isArray(scene.blocks)) {
          for (const block of scene.blocks) {
            const newBlockId = genId('blk');
            
            const mappedCharacterId = block.character_id ? (characterIdMap[block.character_id] || null) : null;
            await blockRepo.insert({
              id: newBlockId as any,
              scene_id: sceneIdToUse as any,
              character_id: mappedCharacterId as any,
              type: block.type || 'DIALOGUE',
              content: block.content || '',
              metadata: block.metadata || '{}',
              sort_order: block.sort_order || 0.0
            }, tx);
          }
        }
      }
    }

    // 9. Scene Characters (M2M)
    if (scene_characters && Array.isArray(scene_characters)) {
      for (const sc of scene_characters) {
        const newSceneId = sc.scene_id ? (sceneIdMap[sc.scene_id] || null) : null;
        const newCharId = sc.character_id ? (characterIdMap[sc.character_id] || null) : null;
        if (!newSceneId || !newCharId) continue;

        try {
          // scene_characters is a M2M table with a composite primary key (scene_id, character_id).
          // It does NOT have an `id` column.
          await scCharRepo.insert({
            scene_id: newSceneId,
            character_id: newCharId
          } as any, tx);
        } catch (e) {
          throw new DomainError({ code: ErrorCode.INTEGRITY, message: 'Failed to insert scene character', cause: e });
        }
      }
    }

    // 10. Character Relationships
    if (character_relationships && Array.isArray(character_relationships)) {
      for (const rel of character_relationships) {
        const newRelId = genId('rel');
        const newCharId = rel.character_id ? (characterIdMap[rel.character_id] || null) : null;
        const newPartnerId = rel.partner_id ? (characterIdMap[rel.partner_id] || null) : null;
        if (!newCharId || !newPartnerId) continue;

        try {
          await charRelRepo.insert({
            id: newRelId,
            scenario_id: newScenarioId,
            character_id: newCharId,
            partner_id: newPartnerId,
            relationship_type: rel.relationship_type || 'MARRIAGE',
            relationship_category: rel.relationship_category || 'BIOLOGICAL'
          }, tx);
        } catch (e) {
          throw new DomainError({ code: ErrorCode.INTEGRITY, message: 'Failed to insert character relationship', cause: e });
        }
      }
    }

    // 11. Crew Assignments
    if (jsonData.crew_assignments && Array.isArray(jsonData.crew_assignments)) {
      for (const assignment of jsonData.crew_assignments) {
        const newAssignId = genId('asg');
        const newCrewId = assignment.crew_id ? (crewIdMap[assignment.crew_id] || null) : null;
        const newEpId = assignment.episode_id ? (episodeIdMap[assignment.episode_id] || null) : null;
        const newScId = assignment.scene_id ? (sceneIdMap[assignment.scene_id] || null) : null;
        if (!newCrewId) continue;

        try {
          await crewAssignRepo.insert({
            id: newAssignId,
            scenario_id: newScenarioId,
            crew_id: newCrewId,
            episode_id: newEpId,
            scene_id: newScId
          }, tx);
        } catch (e) {
          throw new DomainError({ code: ErrorCode.INTEGRITY, message: 'Failed to insert crew assignment', cause: e });
        }
      }
    }

    // 12. Production Tasks
    if (jsonData.production_tasks && Array.isArray(jsonData.production_tasks)) {
      for (const task of jsonData.production_tasks) {
        const newTaskId = genId('tsk');
        const newScId = task.scene_id ? (sceneIdMap[task.scene_id] || null) : null;
        const newCrewId = task.crew_id ? (crewIdMap[task.crew_id] || null) : null;

        await taskRepo.insert({
          id: newTaskId,
          scenario_id: newScenarioId,
          scene_id: newScId,
          crew_id: newCrewId,
          title: task.title || 'مهمة جديدة',
          department: task.department || 'General',
          status: task.status || 'TODO'
        }, tx);
      }
    }

    return newScenarioId;
  }
}

