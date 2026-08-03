const NOT_IMPLEMENTED = 'Client portal service is not implemented in this assignment scaffold.';

export async function getAllClientFeedback(): Promise<unknown[]> {
  return [];
}

export async function getClientProjects(_userId: string): Promise<unknown[]> {
  return [];
}

export async function getClientProjectById(
  _userId: string,
  _projectId: string,
): Promise<null> {
  return null;
}

export async function sendClientInvitation(_input: {
  accountId: string;
  email: string;
  invitedBy: string;
  expiresInDays?: number;
}): Promise<never> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function clientApproveProject(_input: {
  projectId: string;
  workflowInstanceId?: string;
  clientUserId: string;
  notes?: string;
  supabaseClient?: unknown;
}): Promise<never> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function clientRejectProject(_input: {
  projectId: string;
  workflowInstanceId?: string;
  clientUserId: string;
  notes?: string;
  issues?: unknown;
  supabaseClient?: unknown;
}): Promise<never> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function submitClientFeedback(_input: {
  projectId: string;
  clientUserId: string;
  satisfactionScore?: number;
  whatWentWell?: string;
  whatNeedsImprovement?: string;
  workflowHistoryId?: string;
}): Promise<never> {
  throw new Error(NOT_IMPLEMENTED);
}
