import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Username } from '../username.entity';
import { User } from '../../user/user.entity';

@Injectable()
export class UsernameService {
  constructor(
    @InjectRepository(Username)
    private usernameRepository: Repository<Username>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource
  ) {}

  async setUsername(userId: string, username: string, isSearchable: boolean) {
    return this.dataSource.transaction(async (manager) => {
      // 1. Проверяем, не занято ли имя
      const existing = await manager.findOne(Username, {
        where: { username },
      });

      if (existing && existing.user.id !== userId) {
        throw new ConflictException('Username is already taken');
      }

      // 2. Находим пользователя
      const user = await manager.findOne(User, {
        where: { id: userId },
        relations: ['username'],
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // 3. Создаём или обновляем запись
      let userUsername = user.username;
      if (!userUsername) {
        userUsername = manager.create(Username);
        userUsername.user = user;
      }

      userUsername.username = username;
      userUsername.isSearchable = isSearchable;

      await manager.save(userUsername);
      return userUsername;
    });
  }

  async findUserByUsername(username: string) {
    const usernameRecord = await this.usernameRepository.findOne({
      where: { username, isSearchable: true },
      relations: ['user'],
    });

    if (!usernameRecord) {
      return null;
    }

    return {
      id: usernameRecord.user.id,
      publicKey: usernameRecord.user.publicKey.toString('base64'),
      displayName: usernameRecord.user.displayName,
    };
  }
}
