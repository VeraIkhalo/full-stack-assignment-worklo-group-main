const NOT_IMPLEMENTED = 'Form service is not implemented in this assignment scaffold.';

export async function submitFormResponse(_input: {
  formTemplateId: string;
  responseData: unknown;
  submittedBy: string;
  workflowHistoryId?: string;
}): Promise<never> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function getFormResponseById(_id: string): Promise<null> {
  return null;
}

export async function getFormResponseByHistoryId(_historyId: string): Promise<null> {
  return null;
}
