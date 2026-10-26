// ==========================================
// Cortex — Cliente HTTP Base
// Utiliza Cookies HttpOnly + Secure (credentials: 'include')
// ==========================================

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5220';

export interface ApiError {
  status: number;
  title: string;
  detail: string;
  instance?: string;
}

export class ProblemDetailsError extends Error {
  status: number;
  title: string;
  detail: string;

  constructor(status: number, title: string, detail: string) {
    super(detail || title || 'Erro na requisição');
    this.name = 'ProblemDetailsError';
    this.status = status;
    this.title = title;
    this.detail = detail;
  }
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});

  // Apenas define Content-Type JSON se o body não for FormData (para suportar uploads de arquivos)
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // OBRIGATÓRIO: envia e recebe cookies HttpOnly + Secure cross-origin
  });

  if (!response.ok) {
    let errorStatus = response.status;
    let errorTitle = response.statusText || 'Erro na requisição';
    let errorDetail = 'Ocorreu um erro ao processar a solicitação.';

    try {
      const errorJson = await response.json();
      errorStatus = errorJson.status || errorStatus;
      errorTitle = errorJson.title || errorTitle;
      errorDetail = errorJson.detail || errorJson.title || errorJson.message || errorDetail;
    } catch {
      // Se não for JSON, mantém as mensagens padrão
    }

    // Sessão expirada ou não autenticada: redireciona apenas se não estiver nas telas públicas
    if (response.status === 401 && typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname !== '/login' && pathname !== '/registro') {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = '/login';
      }
    }

    throw new ProblemDetailsError(errorStatus, errorTitle, errorDetail);
  }

  if (response.status === 204) {
    return null as unknown as T;
  }

  return response.json() as Promise<T>;
}
