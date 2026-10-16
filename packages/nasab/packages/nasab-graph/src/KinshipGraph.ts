import { Person, KinshipEdge, UUID, RelationCategory } from '@nasab/model';

export class KinshipGraph {
  private nodes: Map<UUID, Person> = new Map();
  private edges: Map<UUID, KinshipEdge> = new Map();

  // الفهارس لتسريع الاستعلام (Adjacency Lists)
  private adjacencyList: Map<UUID, UUID[]> = new Map();
  private incomingEdges: Map<UUID, UUID[]> = new Map();
  private outgoingEdges: Map<UUID, UUID[]> = new Map();

  constructor() {}

  /** إضافة عقدة (شخص) إلى الرسم البياني */
  public addNode(person: Person): void {
    if (this.nodes.has(person.id)) {
      throw new Error(`Node with ID ${person.id} already exists`);
    }
    this.nodes.set(person.id, person);
    this.adjacencyList.set(person.id, []);
    this.incomingEdges.set(person.id, []);
    this.outgoingEdges.set(person.id, []);
  }

  /** الحصول على عقدة */
  public getNode(id: UUID): Person | undefined {
    return this.nodes.get(id);
  }

  /** إضافة علاقة (حافة) بين شخصين */
  public addEdge(edge: KinshipEdge): void {
    if (!this.nodes.has(edge.sourceId)) {
      throw new Error(`Source node ${edge.sourceId} does not exist`);
    }
    if (!this.nodes.has(edge.targetId)) {
      throw new Error(`Target node ${edge.targetId} does not exist`);
    }
    if (this.edges.has(edge.edgeId)) {
      throw new Error(`Edge with ID ${edge.edgeId} already exists`);
    }

    this.edges.set(edge.edgeId, edge);

    // تحديث فهارس المجاورة
    this.adjacencyList.get(edge.sourceId)?.push(edge.targetId);
    this.outgoingEdges.get(edge.sourceId)?.push(edge.edgeId);
    this.incomingEdges.get(edge.targetId)?.push(edge.edgeId);
  }

  /** الحصول على جميع الروابط الخارجة من شخص */
  public getOutgoingEdges(nodeId: UUID): KinshipEdge[] {
    const edgeIds = this.outgoingEdges.get(nodeId) || [];
    return edgeIds.map(id => this.edges.get(id)!);
  }

  /** الحصول على جميع الروابط الداخلة إلى شخص */
  public getIncomingEdges(nodeId: UUID): KinshipEdge[] {
    const edgeIds = this.incomingEdges.get(nodeId) || [];
    return edgeIds.map(id => this.edges.get(id)!);
  }

  /** البحث عن جميع العلاقات من فئة معينة */
  public getEdgesByCategory(nodeId: UUID, category: RelationCategory): KinshipEdge[] {
    const outgoing = this.getOutgoingEdges(nodeId).filter(e => e.relationCategory === category);
    const incoming = this.getIncomingEdges(nodeId).filter(e => e.relationCategory === category);
    return [...outgoing, ...incoming];
  }
}
