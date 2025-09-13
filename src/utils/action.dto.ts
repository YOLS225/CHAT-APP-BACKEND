export interface Action<T> {
  data?: T;
  success?: boolean;
  message?: string;
}

export function failAction<T>(
  data: T,
  success: false,
  message?: string,
): Action<T> {
  return { data, success, message };
}

export function successAction<T>(
  data: T,
  success: true,
  message?: string,
): Action<T> {
  return { data, success, message };
}
