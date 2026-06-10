// In-memory holder for the document ids currently being dragged.
// Used to share the drag payload between the document list and the sidebar
// drop targets (HTML5 drag-and-drop dataTransfer is only readable on drop).
let draggedDocIds: number[] = [];

export const setDraggedDocIds = (ids: number[]): void => { draggedDocIds = ids; };
export const getDraggedDocIds = (): number[] => draggedDocIds;
export const clearDraggedDocIds = (): void => { draggedDocIds = []; };
