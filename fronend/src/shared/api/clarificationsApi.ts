import { apiRequest, ApiError } from "./apiClient";
import { endpoints } from "./endpoints";
import type { ClarificationDto, SubmitClarificationRequest } from "./types";

export async function listClarifications(): Promise<ClarificationDto[]> {
  const { ok, status, data } = await apiRequest(endpoints.listClarification, {
    method: "GET",
  });

  if (!ok) {
    throw new ApiError("Unable to load clarifications", { status, body: data });
  }
  return Array.isArray(data) ? (data as ClarificationDto[]) : [];
}

export async function submitClarification({
  problemName,
  question,
}: {
  problemName: string;
  question: string;
}) {
  const body: SubmitClarificationRequest = {
    ProblemName: problemName,
    Question: question,
  };

  return apiRequest(endpoints.submitClarification, {
    method: "POST",
    body,
  });
}
