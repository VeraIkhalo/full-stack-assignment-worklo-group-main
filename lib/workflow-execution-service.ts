const NOT_IMPLEMENTED =
  'Workflow execution service is not implemented in this assignment scaffold.';

export async function getUserPendingApprovals(
  _supabase: unknown,
  _userId: string,
): Promise<unknown[]> {
  return [];
}

export async function getUserActiveProjects(
  _supabase: unknown,
  _userId: string,
): Promise<unknown[]> {
  return [];
}

export async function startWorkflowForProject(
  _supabase: unknown,
  _projectId: string,
  _templateId: string,
  _userId: string,
): Promise<{ success: boolean; workflowInstanceId?: string; error?: string }> {
  return { success: false, error: NOT_IMPLEMENTED };
}

export async function progressWorkflowStep(
  _supabase: unknown,
  _instanceId: string,
  _activeStepId: string | null,
  _userId: string,
  _decision?: string,
  _feedback?: string,
  _formResponseId?: string,
  _assignedUserId?: string,
  _formData?: unknown,
  _assignedUsersPerNode?: unknown,
): Promise<{
  success: boolean;
  nextNode?: unknown;
  newActiveSteps?: unknown[];
  error?: string;
}> {
  return { success: false, error: NOT_IMPLEMENTED };
}

export async function getActiveSteps(
  _supabase: unknown,
  _instanceId: string,
): Promise<unknown[]> {
  return [];
}

export async function getAllActiveAndWaitingSteps(
  _supabase: unknown,
  _instanceId: string,
): Promise<unknown[]> {
  return [];
}

export async function isWorkflowComplete(
  _supabase: unknown,
  _instanceId: string,
): Promise<boolean> {
  return false;
}
