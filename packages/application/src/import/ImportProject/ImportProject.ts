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
import { ImportOptions, ImportResult } from './Types.js';
import { validateImportPayload } from './Validator.js';
import { DomainError, ErrorCode, generateId } from '@scriptflow/core';

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
    const taskRepo = new ProductionTaskRepository();

    const mode = options.mode || 'COPY'; // 'COPY' | 'OVERWRITE' | 'MERGE'
    const conflictScenarioId = options.conflictScenarioId || null;

    const { 
      scenario, scenes, characters, locations, episodes, crew, shoot_days,
      scene_characters, character_relationships, location_images,
      production_tasks, crew_assignments, page_numbering, scene_reminders,
      location_documents, crew_day_assignments, tones
    } = jsonData;
    
    if (!scenario) throw new Error('Invalid JSON format: missing scenario data');

    let newScenarioId: string;

    if (mode === 'OVERWRITE' && conflictScenarioId) {
      await scenarioRepo.clearScenarioContents(conflictScenarioId, tx);
      newScenarioId = conflictScenarioId;
    } else if (mode === 'MERGE' && conflictScenarioId) {
      newScenarioId = conflictScenarioId;
    } else {
      newScenarioId = generateId('prj');
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
      } as any, tx);
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
      } as any, tx);
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
          if (epById && epById.scenario_id === newScenarioId) {
            epIdToUse = ep.id;
            isExisting = true;
          } else {
            const existingEp = await tx.select<{id: string}>('SELECT id FROM episodes WHERE scenario_id = $1 AND episode_number = $2 LIMIT 1', [newScenarioId, ep.episode_number]);
            if (existingEp && existingEp.length > 0) {
              epIdToUse = existingEp[0].id;
              isExisting = true;
            } else {
              epIdToUse = generateId('epi');
            }
          }
        } else if (mode === 'COPY') {
          epIdToUse = generateId('epi');
        }

        episodeIdMap[ep.id] = epIdToUse;

        if (isExisting) {
          await epRepo.update(epIdToUse, {
            episode_number: ep.episode_number || 1,
            title: ep.title || '',
            description: ep.description || ep.summary || '',
            status: ep.status || 'DRAFT'
          } as any, tx);
        } else {
          await epRepo.insert({
            id: epIdToUse,
            scenario_id: newScenarioId,
            episode_number: ep.episode_number || 1,
            title: ep.title || '',
            description: ep.description || ep.summary || '',
            status: ep.status || 'DRAFT'
          } as any, tx);
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
          if (crewById && crewById.scenario_id === newScenarioId) {
            crewIdToUse = member.id;
            isExisting = true;
          } else {
            const existingCrew = await tx.select<{id: string}>('SELECT id FROM crew WHERE scenario_id = $1 AND name = $2 LIMIT 1', [newScenarioId, member.name]);
            if (existingCrew && existingCrew.length > 0) {
              crewIdToUse = existingCrew[0].id;
              isExisting = true;
            } else {
              crewIdToUse = generateId('crw');
            }
          }
        } else if (mode === 'COPY') {
          crewIdToUse = generateId('crw');
        }

        crewIdMap[member.id] = crewIdToUse;

        if (isExisting) {
          await crewRepo.update(crewIdToUse, {
            name: member.name || 'عضو جديد',
            role: member.role || 'ACTOR',
            category: member.category || 'TECHNICAL',
            department: member.department || 'Production',
            image_url: member.image_url || '',
            phone: member.phone || '',
            email: member.email || '',
            notes: member.notes || '',
            daily_rate: member.daily_rate ?? member.wage ?? 0
          } as any, tx);
        } else {
          await crewRepo.insert({
            id: crewIdToUse,
            scenario_id: newScenarioId,
            name: member.name || 'عضو جديد',
            role: member.role || 'ACTOR',
            category: member.category || 'TECHNICAL',
            department: member.department || 'Production',
            image_url: member.image_url || '',
            phone: member.phone || '',
            email: member.email || '',
            notes: member.notes || '',
            daily_rate: member.daily_rate ?? member.wage ?? 0
          } as any, tx);
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
          if (charById && charById.scenario_id === newScenarioId) {
            charIdToUse = char.id;
            isExisting = true;
          } else {
            const existingChar = await tx.select<{id: string}>('SELECT id FROM characters WHERE scenario_id = $1 AND name = $2 AND deleted_at IS NULL LIMIT 1', [newScenarioId, char.name]);
            if (existingChar && existingChar.length > 0) {
              charIdToUse = existingChar[0].id;
              isExisting = true;
            } else {
              charIdToUse = generateId('chr');
            }
          }
        } else if (mode === 'COPY') {
          charIdToUse = generateId('chr');
        }

        characterIdMap[char.id] = charIdToUse;
        const mappedActorId = char.actor_id ? (crewIdMap[char.actor_id] || null) : null;
        const photo = char.actor_photo || '';

        const charPayload = {
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
          actor_id: mappedActorId,
          birth_date: char.birth_date || null,
          death_date: char.death_date || null,
          dramatic_pos_x: Number(char.dramatic_pos_x) || 0,
          dramatic_pos_y: Number(char.dramatic_pos_y) || 0,
          metadata: typeof char.metadata === 'object' ? JSON.stringify(char.metadata) : (char.metadata || '{}')
        };

        if (isExisting) {
          await charRepo.update(charIdToUse, charPayload as any, tx);
        } else {
          await charRepo.insert({
            id: charIdToUse,
            scenario_id: newScenarioId,
            ...charPayload
          } as any, tx);
        }
      }

      // Second pass for character lineage (father_id, mother_id)
      for (const char of characters) {
        const charId = characterIdMap[char.id];
        const mappedFatherId = char.father_id ? (characterIdMap[char.father_id] || null) : null;
        const mappedMotherId = char.mother_id ? (characterIdMap[char.mother_id] || null) : null;
        if (charId && (mappedFatherId || mappedMotherId)) {
          await tx.execute('UPDATE characters SET father_id = $1, mother_id = $2 WHERE id = $3', [mappedFatherId, mappedMotherId, charId]);
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
          if (locById && locById.scenario_id === newScenarioId) {
            locIdToUse = loc.id;
            isExisting = true;
          } else {
            const existingLoc = await tx.select<{id: string}>('SELECT id FROM locations WHERE scenario_id = $1 AND name = $2 AND deleted_at IS NULL LIMIT 1', [newScenarioId, loc.name]);
            if (existingLoc && existingLoc.length > 0) {
              locIdToUse = existingLoc[0].id;
              isExisting = true;
            } else {
              locIdToUse = generateId('loc');
            }
          }
        } else if (mode === 'COPY') {
          locIdToUse = generateId('loc');
        }

        locationIdMap[loc.id] = locIdToUse;

        const locPayload = {
          name: loc.name || 'موقع جديد',
          type: loc.type || loc.location_type || 'INT',
          address: loc.address || '',
          description: loc.description || '',
          image: loc.image || loc.image_url || '',
          status: loc.status || 'AVAILABLE',
          map_url: loc.map_url || '',
          latitude: loc.latitude ?? null,
          longitude: loc.longitude ?? null,
          contact_name: loc.contact_name || '',
          contact_phone: loc.contact_phone || '',
          permit_status: loc.permit_status || 'NOT_REQUIRED',
          cost_per_day: Number(loc.cost_per_day) || 0.0,
          cost_currency: loc.cost_currency || 'USD',
          technical_notes: loc.technical_notes || ''
        };

        if (isExisting) {
          await locRepo.update(locIdToUse, locPayload as any, tx);
        } else {
          await locRepo.insert({
            id: locIdToUse,
            scenario_id: newScenarioId,
            ...locPayload
          } as any, tx);
        }
      }

      // Second pass for parent_location_id
      for (const loc of locations) {
        const locId = locationIdMap[loc.id];
        const mappedParentId = loc.parent_location_id ? (locationIdMap[loc.parent_location_id] || null) : null;
        if (locId && mappedParentId) {
          await tx.execute('UPDATE locations SET parent_location_id = $1 WHERE id = $2', [mappedParentId, locId]);
        }
      }
    }

    // 6. Insert Location Images
    if (location_images && Array.isArray(location_images)) {
      for (const li of location_images) {
        const mappedLocId = li.location_id ? (locationIdMap[li.location_id] || null) : null;
        if (!mappedLocId) continue;
        const newLiId = generateId('lim');

        await locImgRepo.insert({
          id: newLiId,
          location_id: mappedLocId,
          image_url: li.image_url || li.url || '',
          is_primary: li.is_primary ? 1 : 0,
          sort_order: Number(li.sort_order) || 0
        } as any, tx);
      }
    }

    // 7. Insert/Update Shoot Days
    if (shoot_days && Array.isArray(shoot_days)) {
      for (const sd of shoot_days) {
        let sdIdToUse = sd.id;
        let isExisting = false;

        if (mode === 'MERGE') {
          const sdById = await shootDayRepo.findById(sd.id, tx);
          if (sdById && sdById.scenario_id === newScenarioId) {
            sdIdToUse = sd.id;
            isExisting = true;
          } else {
            const existingSd = await tx.select<{id: string}>('SELECT id FROM shoot_days WHERE scenario_id = $1 AND shoot_date = $2 LIMIT 1', [newScenarioId, sd.shoot_date]);
            if (existingSd && existingSd.length > 0) {
              sdIdToUse = existingSd[0].id;
              isExisting = true;
            } else {
              sdIdToUse = generateId('shd');
            }
          }
        } else if (mode === 'COPY') {
          sdIdToUse = generateId('shd');
        }

        shootDaysIdMap[sd.id] = sdIdToUse;

        const sdPayload = {
          shoot_date: sd.shoot_date || '',
          start_time: sd.start_time || '',
          end_time: sd.end_time || '',
          status: sd.status || 'DRAFT',
          notes: sd.notes || '',
          title: sd.title || null,
          day_type: sd.day_type || 'SHOOT',
          primary_location_id: sd.primary_location_id ? (locationIdMap[sd.primary_location_id] || null) : null,
          weather_forecast: sd.weather_forecast || '',
          call_time: sd.call_time || '',
          wrap_time: sd.wrap_time || '',
          estimated_cost: Number(sd.estimated_cost) || 0,
          production_phase: sd.production_phase || 'PRODUCTION',
          week_number: Number(sd.week_number) || 1
        };

        if (isExisting) {
          await shootDayRepo.update(sdIdToUse, sdPayload as any, tx);
        } else {
          await shootDayRepo.insert({
            id: sdIdToUse,
            scenario_id: newScenarioId,
            ...sdPayload
          } as any, tx);
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
          if (sceneById && sceneById.scenario_id === newScenarioId) {
            sceneIdToUse = scene.id;
            isExisting = true;
          } else {
            const existingScene = await tx.select<{id: string}>('SELECT id FROM scenes WHERE scenario_id = $1 AND episode_id IS $2 AND scene_number = $3 AND deleted_at IS NULL LIMIT 1', [newScenarioId, mappedEpisodeId, scene.scene_number]);
            if (existingScene && existingScene.length > 0) {
              sceneIdToUse = existingScene[0].id;
              isExisting = true;
            } else {
              sceneIdToUse = generateId('scn');
            }
          }
        } else if (mode === 'COPY') {
          sceneIdToUse = generateId('scn');
        }

        sceneIdMap[scene.id] = sceneIdToUse;

        // Map present_characters IDs if any
        let presentChars = '[]';
        if (scene.present_characters) {
          try {
            const parsed = typeof scene.present_characters === 'string' ? JSON.parse(scene.present_characters) : scene.present_characters;
            if (Array.isArray(parsed)) {
              const remapped = parsed.map(cId => characterIdMap[cId] || cId);
              presentChars = JSON.stringify(remapped);
            }
          } catch {
            presentChars = '[]';
          }
        }

        const scenePayload = {
          episode_id: mappedEpisodeId,
          location_id: mappedLocationId,
          shoot_day_id: mappedShootDayId,
          scene_number: Number(scene.scene_number) || 1,
          title: scene.title || '',
          description: scene.description || '',
          location_type: scene.location_type || 'INT',
          location_name: scene.location_name || '',
          time_of_day: scene.time_of_day || 'DAY',
          exact_time: scene.exact_time || '',
          weather: scene.weather || '',
          status: scene.status || 'DRAFT',
          revision_color: scene.revision_color || 'WHITE',
          continuity: scene.continuity || '',
          time_shift: scene.time_shift || '',
          director_notes: scene.director_notes || '',
          extras_note: scene.extras_note || '',
          present_characters: presentChars,
          planned_shoot_date: scene.planned_shoot_date || '',
          estimated_duration: Number(scene.estimated_duration) || 0,
          page_count: Number(scene.page_count) || 1,
          page_eighths: Number(scene.page_eighths) || (Number(scene.estimated_duration) > 30 ? Math.round(Number(scene.estimated_duration) / 60) * 8 : 0),
          shoot_order: Number(scene.shoot_order) || 0,
          clone_type: scene.clone_type || null
        };

        if (isExisting) {
          await sceneRepo.update(sceneIdToUse, scenePayload as any, tx);
        } else {
          await sceneRepo.insert({
            id: sceneIdToUse,
            scenario_id: newScenarioId,
            ...scenePayload
          } as any, tx);
        }

        // Script Blocks (clean & overwrite for this scene)
        await blockRepo.deleteAllBy('scene_id', sceneIdToUse, tx);
        if (scene.blocks && Array.isArray(scene.blocks)) {
          for (const block of scene.blocks) {
            const newBlockId = generateId('blk');
            const mappedCharacterId = block.character_id ? (characterIdMap[block.character_id] || null) : null;
            await blockRepo.insert({
              id: newBlockId,
              scene_id: sceneIdToUse,
              character_id: mappedCharacterId,
              type: block.type || 'DIALOGUE',
              content: block.content || '',
              metadata: typeof block.metadata === 'object' ? JSON.stringify(block.metadata) : (block.metadata || '{}'),
              sort_order: Number(block.sort_order) || 0.0
            } as any, tx);
          }
        }
      }

      // Second pass for scene cloning relationships (source_scene_id)
      for (const scene of scenes) {
        const sceneId = sceneIdMap[scene.id];
        const mappedSourceId = scene.source_scene_id ? (sceneIdMap[scene.source_scene_id] || null) : null;
        if (sceneId && mappedSourceId) {
          await tx.execute('UPDATE scenes SET source_scene_id = $1 WHERE id = $2', [mappedSourceId, sceneId]);
        }
      }
    }

    // 9. Scene Characters (M2M with INSERT OR IGNORE)
    if (scene_characters && Array.isArray(scene_characters)) {
      for (const sc of scene_characters) {
        const newSceneId = sc.scene_id ? (sceneIdMap[sc.scene_id] || null) : null;
        const newCharId = sc.character_id ? (characterIdMap[sc.character_id] || null) : null;
        if (!newSceneId || !newCharId) continue;

        await tx.execute(
          'INSERT OR IGNORE INTO scene_characters (scene_id, character_id) VALUES ($1, $2)',
          [newSceneId, newCharId]
        );
      }
    }

    // 10. Character Relationships (with INSERT OR IGNORE)
    if (character_relationships && Array.isArray(character_relationships)) {
      for (const rel of character_relationships) {
        const newRelId = generateId('rel');
        const newCharId = rel.character_id ? (characterIdMap[rel.character_id] || null) : null;
        const newPartnerId = rel.partner_id ? (characterIdMap[rel.partner_id] || null) : null;
        if (!newCharId || !newPartnerId) continue;

        await tx.execute(
          `INSERT OR IGNORE INTO character_relationships (id, scenario_id, character_id, partner_id, relationship_type, relationship_category)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [newRelId, newScenarioId, newCharId, newPartnerId, rel.relationship_type || 'MARRIAGE', rel.relationship_category || 'BIOLOGICAL']
        );
      }
    }

    // 11. Crew Assignments (with INSERT OR IGNORE)
    if (crew_assignments && Array.isArray(crew_assignments)) {
      for (const assignment of crew_assignments) {
        const newAssignId = generateId('asn');
        const newCrewId = assignment.crew_id ? (crewIdMap[assignment.crew_id] || null) : null;
        const newEpId = assignment.episode_id ? (episodeIdMap[assignment.episode_id] || null) : null;
        const newScId = assignment.scene_id ? (sceneIdMap[assignment.scene_id] || null) : null;
        if (!newCrewId) continue;

        await tx.execute(
          `INSERT OR IGNORE INTO crew_assignments (id, scenario_id, crew_id, episode_id, scene_id, assigned_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
          [newAssignId, newScenarioId, newCrewId, newEpId, newScId]
        );
      }
    }

    // 12. Production Tasks
    if (production_tasks && Array.isArray(production_tasks)) {
      for (const task of production_tasks) {
        const newTaskId = generateId('tsk');
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
        } as any, tx);
      }
    }

    // 13. Page Numbering
    if (page_numbering && Array.isArray(page_numbering)) {
      for (const pgn of page_numbering) {
        const newPgnId = generateId('pgn');
        const mappedItemId = pgn.item_type === 'SCENE'
          ? (sceneIdMap[pgn.item_id] || pgn.item_id)
          : (episodeIdMap[pgn.item_id] || pgn.item_id);

        await tx.execute(
          `INSERT OR IGNORE INTO page_numbering (id, scenario_id, item_id, item_type, page_count, start_page, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [newPgnId, newScenarioId, mappedItemId, pgn.item_type, Number(pgn.page_count) || 1, Number(pgn.start_page) || 1, Number(pgn.sort_order) || 0]
        );
      }
    }

    // 14. Scene Reminders
    if (scene_reminders && Array.isArray(scene_reminders)) {
      for (const rem of scene_reminders) {
        const mappedSceneId = rem.scene_id ? (sceneIdMap[rem.scene_id] || null) : null;
        if (!mappedSceneId) continue;
        const newRemId = generateId('rem');

        await tx.execute(
          'INSERT INTO scene_reminders (id, scene_id, content, is_completed) VALUES ($1, $2, $3, $4)',
          [newRemId, mappedSceneId, rem.content || '', rem.is_completed ? 1 : 0]
        );
      }
    }

    // 15. Tones
    if (tones && Array.isArray(tones)) {
      for (const tone of tones) {
        const newTonId = generateId('ton');
        await tx.execute(
          `INSERT OR IGNORE INTO tones (id, scenario_id, name, color, created_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
          [newTonId, newScenarioId, tone.name || 'نبرة', tone.color || '#6366f1']
        );
      }
    }

    return newScenarioId;
  }
}
