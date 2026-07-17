import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

interface JwtPayload {
  sub: string; // convention JWT standard : "sub" = subject = l'identifiant de l'utilisateur
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // lit "Authorization: Bearer <token>"
      ignoreExpiration: false, // un token expiré doit être rejeté, pas ignoré
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  // Appelée automatiquement par Passport UNE FOIS la signature et l'expiration du token vérifiées.
  // Ce qu'on retourne ici devient "request.user" dans les controllers.
  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      // Cas : token valide mais utilisateur supprimé entre-temps -> on refuse quand même.
      throw new UnauthorizedException('Utilisateur introuvable');
    }
    return { userId: user._id.toString(), email: user.email, name: user.name };
  }
}
