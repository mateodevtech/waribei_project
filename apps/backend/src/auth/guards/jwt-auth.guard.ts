import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // getAllAndOverride : regarde d'abord la méthode précise du controller,
    // puis la classe entière si rien trouvé -> permet @Public() sur une seule route
    // même si le reste du controller est protégé.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // Pas de vérification de rôle ici (contrairement à ton ancien RolesGuard) :
    // le domaine Waribei ne définit qu'un seul type d'utilisateur -> voir la discussion
    // sur YAGNI qu'on a eue avant de coder cette partie.
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
    return user;
  }
}
