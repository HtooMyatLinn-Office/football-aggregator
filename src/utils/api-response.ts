import type { Response } from 'express';

export interface ApiSuccessMeta {
  page?: number;
  limit?: number;
  total?: number;
  source?: string;
  cached?: boolean;
  providers?: string[];
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: ApiSuccessMeta;
}

export interface ApiErrorBody {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorBody;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  meta: ApiSuccessMeta = {},
  statusCode = 200,
): void {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta,
  };
  res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  code?: string,
  details?: Record<string, unknown>,
): void {
  const body: ApiErrorResponse = {
    success: false,
    error: { message, code, details },
  };
  res.status(statusCode).json(body);
}
