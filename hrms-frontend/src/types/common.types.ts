export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  success: false;
  error: {
    status_code: number;
    detail: Record<string, unknown> | string;
  };
}

export interface SelectOption {
  value: string;
  label: string;
}
