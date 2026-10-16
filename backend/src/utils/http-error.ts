/**
 * Erreur métier portant un code HTTP. À lever depuis les services/contrôleurs ;
 * le middleware errorHandler la convertit en réponse JSON.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, message: string, code = 'ERROR') {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}
