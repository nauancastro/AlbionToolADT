import { HttpErrorResponse } from '@angular/common/http';

/** Converte um erro HTTP em uma mensagem amigável em PT-BR para exibição na UI. */
export function friendlyHttpError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'Não foi possível conectar à Albion Online Data Project API. Verifique sua conexão e tente novamente.';
    }
    return `A API retornou um erro (HTTP ${err.status}). Tente novamente em instantes.`;
  }
  return 'Ocorreu um erro inesperado ao buscar os preços.';
}
