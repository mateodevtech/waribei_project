import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const SALT_ROUNDS = 10; // coût du hashing bcrypt : compromis sécurité/performance standard

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    // On ne stocke JAMAIS le mot de passe en clair, seulement son hash bcrypt (irréversible).
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    return this.buildTokenResponse(user._id.toString(), user.email, user.name);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    // Message volontairement IDENTIQUE que l'email n'existe pas OU que le mot de passe
    // soit faux -> ne jamais révéler laquelle des deux infos est incorrecte
    // (éviter qu'un attaquant devine quels emails sont enregistrés dans le système).
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    return this.buildTokenResponse(user._id.toString(), user.email, user.name);
  }

  private buildTokenResponse(userId: string, email: string, name: string) {
    const accessToken = this.jwtService.sign({ sub: userId, email });
    return { accessToken, user: { id: userId, email, name } };
  }
}
