import { Injectable } from '@nestjs/common';
import { User, UserDocument } from './schemas/user.schema';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  create(data: Partial<User>): Promise<UserDocument> {
    return this.usersRepository.create(data);
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.usersRepository.findByEmail(email);
  }

  findById(id: string): Promise<UserDocument | null> {
    return this.usersRepository.findById(id);
  }
}
