// SECURITY CONTAINMENT (Dia 1)
//
// Real credentials and personally identifiable information must never be bundled
// in the browser application. The previous generated fixture was removed from the
// current tree. Identity data will be loaded only through an authenticated,
// server-authorized API introduced in the identity workstream.

export type RespUser = {
  login: string;
  setor: string;
  status: string;
  responsavel: string;
  prontuario: string;
  email: string;
  telefone: string;
  secretaria: string;

  // Legacy compatibility while the remaining screens migrate to typed contracts.
  // No field below is populated with real data in the client bundle.
  senha?: string;
  responsavelNome?: string;
  prontuarioResponsavel?: string;
  cargoResponsavel?: string;
  secretariaNome?: string;
  secretariaCodigo?: string;
  unidadeNome?: string;
  unidadeCodigo?: string;
  papel?: string;
  vigenciaInicio?: string;
  vigenciaFim?: string;

  [key: string]: string | undefined;
};

/**
 * Deliberately empty in production-facing source code.
 *
 * Use synthetic factories in automated tests. Real users, credentials and
 * organizational assignments belong to the server-side identity store and must
 * be returned only after authentication and authorization.
 */
export const RESP_USERS: RespUser[] = [];
