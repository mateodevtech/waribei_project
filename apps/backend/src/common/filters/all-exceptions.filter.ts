import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * @Catch() sans argument -> intercepte TOUTES les exceptions (Nest ou non),
 * pas seulement les HttpException. Sans ce filet, une erreur inattendue
 * (ex: bug dans un pipeline d'agrégation) planterait avec une stack trace brute
 * renvoyée au client -> mauvaise pratique de sécurité (fuite d'infos internes)
 * ET mauvaise expérience utilisateur (le frontend ne peut rien afficher de propre).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Si c'est une exception Nest connue (NotFoundException, BadRequestException...),
    // on récupère son vrai status HTTP et son message. Sinon (erreur JS brute, bug),
    // on renvoie 500 sans exposer le détail technique au client.
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Une erreur interne est survenue';

    // Erreur 500 non prévue -> on la log intégralement côté serveur (jamais côté client)
    // pour pouvoir la déboguer, sans jamais l'exposer dans la réponse HTTP.
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof message === 'string' ? message : (message as any).message ?? message,
    });
  }
}
