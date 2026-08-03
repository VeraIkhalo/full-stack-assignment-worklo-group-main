const NOT_IMPLEMENTED = 'Workflow service is not implemented in this assignment scaffold.';

export async function getWorkflowTemplates(): Promise<unknown[]> {
  return [];
}

export async function getAllWorkflowTemplates(): Promise<unknown[]> {
  return [];
}

export async function createWorkflowTemplate(
  _name: string,
  _description: string | null,
  _createdBy: string,
): Promise<never> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function getWorkflowTemplateById(_id: string): Promise<null> {
  return null;
}

export async function updateWorkflowTemplate(
  _id: string,
  _updates: Record<string, unknown>,
  _adminClient?: unknown,
): Promise<null> {
  return null;
}

export async function deleteWorkflowTemplate(
  _id: string,
  _adminClient?: unknown,
): Promise<void> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function createWorkflowNode(
  _templateId: string,
  _nodeData: Record<string, unknown>,
): Promise<never> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function updateWorkflowNode(
  _nodeId: string,
  _data: Record<string, unknown>,
): Promise<null> {
  return null;
}

export async function deleteWorkflowNode(_nodeId: string): Promise<void> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function createWorkflowConnection(
  _templateId: string,
  _fromNodeId: string,
  _toNodeId: string,
  _condition?: unknown,
): Promise<never> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function deleteWorkflowConnection(_connectionId: string): Promise<void> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function startWorkflowInstance(_input: {
  workflowTemplateId: string;
  projectId?: string;
  taskId?: string;
  startNodeId?: string;
}): Promise<never> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function getWorkflowInstanceById(_id: string): Promise<null> {
  return null;
}

export async function getWorkflowHistory(_id: string): Promise<unknown[]> {
  return [];
}

export async function getNextAvailableNodes(_id: string): Promise<unknown[]> {
  return [];
}

export async function handoffWorkflow(
  _supabase: unknown,
  _input: {
    instanceId: string;
    toNodeId: string;
    handedOffBy: string;
    handedOffTo?: string;
    formResponseId?: string;
    notes?: string;
    outOfOrder?: boolean;
  },
): Promise<never> {
  throw new Error(NOT_IMPLEMENTED);
}
