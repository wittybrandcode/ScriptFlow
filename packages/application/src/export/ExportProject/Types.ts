export interface ExportStrategy {
  export(projectData: any): Promise<any>;
}
