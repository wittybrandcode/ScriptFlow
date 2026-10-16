import { Person, Relation, InferredRelation } from '../core/types';
import { RelationType, Gender } from '../core/enums';
import { InferenceEngine } from './InferenceEngine';

export class KinshipEngine {
  private nodes: Person[] = [];
  private edges: Relation[] = [];

  addPerson(id: string, name: string, gender: Gender) {
    const existing = this.nodes.find(n => n.id === id);
    if (existing) {
      existing.name = name;
      existing.gender = gender;
    } else {
      this.nodes.push({ id, name, gender, isDeceased: false });
    }
  }

  addRelation(from: string, to: string, type: RelationType) {
    // Remove duplicate relations
    this.edges = this.edges.filter(e => !(e.sourceId === from && e.targetId === to && e.type === type));
    this.edges.push({ sourceId: from, targetId: to, type });
  }

  getNodes(): Person[] {
    return this.nodes;
  }

  getRelations(): Relation[] {
    return this.edges;
  }

  /**
   * Alias for getRelations to maintain compatibility
   */
  getEdges(): Relation[] {
    return this.getRelations();
  }

  static infer(nodes: Person[], edges: Relation[]): InferredRelation[] {
    return InferenceEngine.infer(nodes, edges);
  }
}
