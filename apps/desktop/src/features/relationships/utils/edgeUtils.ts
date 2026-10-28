import { Position } from '@xyflow/react';

// Returns the intersection point of the line between the center of the intersectionNode and the target node
function getNodeIntersection(intersectionNode: any, targetNode: any): { x: number; y: number } {
  // Support for both XYFlow v11 and v12 node structures
  const intersectionNodeWidth = intersectionNode.measured?.width || intersectionNode.width || 150;
  const intersectionNodeHeight = intersectionNode.measured?.height || intersectionNode.height || 150;
  const intersectionNodePosition = intersectionNode.internals?.positionAbsolute || intersectionNode.positionAbsolute || intersectionNode.position || { x: 0, y: 0 };
  
  const targetNodeWidth = targetNode.measured?.width || targetNode.width || 150;
  const targetNodeHeight = targetNode.measured?.height || targetNode.height || 150;
  const targetPosition = targetNode.internals?.positionAbsolute || targetNode.positionAbsolute || targetNode.position || { x: 0, y: 0 };

  const w = intersectionNodeWidth / 2;
  const h = intersectionNodeHeight / 2;

  const x2 = intersectionNodePosition.x + w;
  const y2 = intersectionNodePosition.y + h;
  const x1 = targetPosition.x + targetNodeWidth / 2;
  const y1 = targetPosition.y + targetNodeHeight / 2;

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  const x = w * (xx3 + yy3) + x2;
  const y = h * (-xx3 + yy3) + y2;

  return { x, y };
}

function getEdgePosition(node: any, intersectionPoint: { x: number; y: number }): Position {
  const nodePosition = node.internals?.positionAbsolute || node.positionAbsolute || node.position || { x: 0, y: 0 };
  const nodeWidth = node.measured?.width || node.width || 150;
  const nodeHeight = node.measured?.height || node.height || 150;
  
  const nx = Math.round(nodePosition.x);
  const ny = Math.round(nodePosition.y);
  const px = Math.round(intersectionPoint.x);
  const py = Math.round(intersectionPoint.y);

  if (px <= nx + 1) {
    return Position.Left;
  }
  if (px >= nx + nodeWidth - 1) {
    return Position.Right;
  }
  if (py <= ny + 1) {
    return Position.Top;
  }
  if (py >= ny + nodeHeight - 1) {
    return Position.Bottom;
  }

  return Position.Top;
}

export interface EdgeParams {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  sourcePos: Position;
  targetPos: Position;
}

// Returns the parameters (sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition) for the edge
export function getEdgeParams(source: any, target: any): EdgeParams {
  const sourceIntersectionPoint = getNodeIntersection(source, target);
  const targetIntersectionPoint = getNodeIntersection(target, source);

  const sourcePos = getEdgePosition(source, sourceIntersectionPoint);
  const targetPos = getEdgePosition(target, targetIntersectionPoint);

  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
    sourcePos,
    targetPos,
  };
}
