export interface ChampInvalide {
  champ: string;
  message: string;
}

/**
 * Erreur métier portant un code HTTP. À lever depuis les services/contrôleurs ;
 * le middleware errorHandler la convertit en réponse JSON.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly champs?: ChampInvalide[];

  constructor(status: number, message: string, code = 'ERROR', champs?: ChampInvalide[]) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.champs = champs;
  }
}

export const introuvable = (message = 'Ressource introuvable') => new HttpError(404, message, 'INTROUVABLE');
export const conflit = (message: string, code = 'CONFLIT') => new HttpError(409, message, code);
