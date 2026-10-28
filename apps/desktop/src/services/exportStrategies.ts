import { exportToPDF } from '../utils/exportPDF';
import { packageService } from './api/packageService';

export interface ProjectData {
  scenario?: any;
  scenes?: any[];
  characters?: any[];
  episodes?: any[];
  shoot_days?: any[];
  pageNumbering?: any;
  [key: string]: any;
}

export interface IExportStrategy {
  export(projectData: any): Promise<any>;
}

export class PDFExportStrategy implements IExportStrategy {
  options: any;

  constructor(options: any = {}) {
    this.options = options;
  }

  async export(projectData: any): Promise<boolean> {
    const { scenario, scenes = [], characters = [], episodes = [], pageNumbering } = projectData || {};
    await exportToPDF({ scenario, scenes, characters, episodes, pageNumbering }, this.options);
    return true;
  }
}

export class CallSheetPDFStrategy implements IExportStrategy {
  options: any;

  constructor(options: any = {}) {
    this.options = { ...options, exportType: 'CALL_SHEET', enableCallSheet: true };
  }

  async export(projectData: any): Promise<boolean> {
    let { scenario, scenes = [], characters = [], shoot_days = [], pageNumbering } = projectData || {};

    // Filter scenes if a shoot day is provided
    if (this.options.filterDayId && this.options.filterDayId !== 'ALL') {
      const dayId = this.options.filterDayId;
      scenes = scenes.filter((s: any) => s.shoot_day_id === dayId);
      
      if (shoot_days) {
        const shootDay = shoot_days.find((d: any) => d.id === dayId);
        if (shootDay) {
          this.options.shootDayData = shootDay;
          this.options.callSheetDate = shootDay.shoot_date;
          this.options.callSheetCallTime = shootDay.call_time || shootDay.start_time;
          this.options.callSheetWrapTime = shootDay.wrap_time || shootDay.end_time;
          this.options.callSheetCrewNotes = shootDay.notes;
        }
      }
    }

    await exportToPDF({ scenario, scenes, characters, episodes: [], pageNumbering }, this.options);
    return true;
  }
}

export class LocationScenesPDFStrategy implements IExportStrategy {
  options: any;

  constructor(options: any = {}) {
    this.options = { ...options, exportType: 'SINGLE_PDF' };
    if (options.filterSceneId) {
       this.options.exportLevel = 'SCENE';
       this.options.targetEntityId = options.filterSceneId;
       this.options.filterSceneId = options.filterSceneId;
    }
  }

  async export(projectData: any): Promise<boolean> {
    let { scenario, scenes = [], characters = [], pageNumbering } = projectData || {};

    if (this.options.filterLocationId && !this.options.filterSceneId) {
      scenes = scenes.filter((s: any) => s.location_id === this.options.filterLocationId);
    }
    
    if (this.options.locationName) {
      scenario = { ...scenario, title: `مشاهد الموقع - ${this.options.locationName}` };
    }
    if (this.options.filterSceneId) {
      const scene = scenes.find((s: any) => s.id === this.options.filterSceneId);
      if (scene) {
        scenario = { ...scenario, title: `مشهد ${scene.scene_number}${scene.title ? ' - ' + scene.title : ''}` };
      }
    }

    await exportToPDF({ scenario, scenes, characters, episodes: [], pageNumbering }, this.options);
    return true;
  }
}

export class JSONExportStrategy implements IExportStrategy {
  async export(projectData: any): Promise<boolean> {
    const { scenario } = projectData || {};
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scenario?.title || 'scenario'}_export.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    return true;
  }
}

export class ScriptFlowPackageStrategy implements IExportStrategy {
  async export(projectData: any): Promise<boolean> {
    await packageService.exportPackage(projectData);
    return true;
  }
}
