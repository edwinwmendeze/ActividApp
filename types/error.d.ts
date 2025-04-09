// types/error.d.ts
export type ErrorType = Error | null;

export interface ErrorResponse {
    message: string;
    code?: string;
    stack?: string;
    details?: Record<string, any>;
}