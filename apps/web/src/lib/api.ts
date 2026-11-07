import { useQuery } from "@tanstack/react-query";
import type { components } from "./schema";
export type Metadata = components["schemas"]["Metadata"];
export type Overview = components["schemas"]["Overview"];
export type Evaluation = components["schemas"]["Evaluation"];
export type PredictionRequest = components["schemas"]["PredictionRequest"];
export type Prediction = components["schemas"]["PredictionResponse"];
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, init);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const fields = data.field_errors
      ?.map(
        (e: { field: string; message: string }) => `${e.field}: ${e.message}`,
      )
      .join("; ");
    throw new ApiError(
      response.status,
      fields ||
        data.detail ||
        data.message ||
        "The service could not complete this request.",
    );
  }
  return response.json();
}
export const useOverview = () =>
  useQuery({
    queryKey: ["overview"],
    queryFn: () => request<Overview>("/tasks/3/overview"),
  });
export const useMetadata = () =>
  useQuery({
    queryKey: ["metadata"],
    queryFn: () => request<Metadata>("/tasks/3/metadata"),
  });
export const useEvaluation = () =>
  useQuery({
    queryKey: ["evaluation"],
    queryFn: () => request<Evaluation>("/tasks/3/evaluation"),
  });
export const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
export const modelName = (name: string) =>
  name.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
