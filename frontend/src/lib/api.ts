export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details: string[] = [],
  ) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // NestJS renvoie soit un message, soit un tableau de messages de validation
    const messages: string[] = Array.isArray(data?.message)
      ? data.message
      : [data?.message ?? "Une erreur inattendue est survenue"];
    throw new ApiError(res.status, messages[0], messages);
  }

  return data as T;
}
