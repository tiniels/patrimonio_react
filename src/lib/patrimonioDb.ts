export type PatrimonioRow = {
  chapa: string;
  descricao: string | null;
  status: string | null;
  situacao: string | null;
  local: string | null;
  local_codigo: string | null;
  conta_contabil_nome: string | null;
  data_baixa: string | null;
  localizacao: string | null;
  estadoConservacao: string | null;
};

export const PATRIMONIO_DATA_UNAVAILABLE_CODE = "PATRIMONIO_DATA_UNAVAILABLE";
export const PATRIMONIO_DATA_UNAVAILABLE_MESSAGE =
  "A consulta patrimonial está temporariamente indisponível enquanto a API autenticada no servidor e as políticas de acesso aos dados são implantadas.";

export class PatrimonioDataUnavailableError extends Error {
  readonly code = PATRIMONIO_DATA_UNAVAILABLE_CODE;
  readonly retryable = false;

  constructor() {
    super(PATRIMONIO_DATA_UNAVAILABLE_MESSAGE);
    this.name = "PatrimonioDataUnavailableError";
  }
}

type DisabledQueryResult = {
  data: null;
  error: PatrimonioDataUnavailableError;
  count: null;
};

/**
 * Compatibility-only query builder.
 *
 * The prototype previously connected the public browser bundle directly to a
 * remote data service. Every operation now resolves to a safe unavailable
 * result until the server-authorized API is implemented. This façade prevents a
 * legacy import from silently restoring direct client access.
 */
class DisabledPatrimonioQuery implements PromiseLike<DisabledQueryResult> {
  select(..._args: unknown[]): this {
    return this;
  }

  insert(..._args: unknown[]): this {
    return this;
  }

  update(..._args: unknown[]): this {
    return this;
  }

  upsert(..._args: unknown[]): this {
    return this;
  }

  delete(..._args: unknown[]): this {
    return this;
  }

  order(..._args: unknown[]): this {
    return this;
  }

  range(..._args: unknown[]): this {
    return this;
  }

  limit(..._args: unknown[]): this {
    return this;
  }

  eq(..._args: unknown[]): this {
    return this;
  }

  neq(..._args: unknown[]): this {
    return this;
  }

  in(..._args: unknown[]): this {
    return this;
  }

  is(..._args: unknown[]): this {
    return this;
  }

  ilike(..._args: unknown[]): this {
    return this;
  }

  single(..._args: unknown[]): this {
    return this;
  }

  maybeSingle(..._args: unknown[]): this {
    return this;
  }

  then<TResult1 = DisabledQueryResult, TResult2 = never>(
    onfulfilled?: ((value: DisabledQueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    const result: DisabledQueryResult = {
      data: null,
      error: new PatrimonioDataUnavailableError(),
      count: null,
    };
    return Promise.resolve(result).then(onfulfilled, onrejected);
  }
}

/**
 * Compatibility export only. It contains no endpoint, key, session or network
 * client and cannot read or mutate protected data.
 */
export const patrimonioDb = Object.freeze({
  from(_relation: string): DisabledPatrimonioQuery {
    return new DisabledPatrimonioQuery();
  },
});

/** Browser memory is not a source of truth for protected patrimonial data. */
export function getCached(): PatrimonioRow[] | null {
  return null;
}

/** No direct client-side database count is permitted. */
export async function fetchTotalCount(): Promise<number> {
  throw new PatrimonioDataUnavailableError();
}

/**
 * Protected data will be fetched only through the versioned, server-authorized
 * API described by the OpenAPI contract.
 */
export async function fetchAllPatrimonio(
  _onProgress?: (loaded: number, total: number) => void,
): Promise<PatrimonioRow[]> {
  throw new PatrimonioDataUnavailableError();
}
