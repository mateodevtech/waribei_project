import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: "L'email est obligatoire" })
  @IsEmail({}, { message: "L'email n'est pas valide" })
  email: string;

  @IsNotEmpty({ message: 'Le mot de passe est obligatoire' })
  @IsString()
  password: string;
}
