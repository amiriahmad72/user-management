import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UUID, createHash, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { Avatar } from './entities/avatar.entity';

@Injectable()
export class AvatarService {

  baseDirectoryPath: string;

  constructor(@InjectModel(Avatar.name) private readonly avatarModel: Model<Avatar>, private readonly configService: ConfigService) {
    this.baseDirectoryPath = this.configService.get<string>('UPLOADED_AVATARS_PATH', './avatars');
  }

  async findOrSaveAvatar(userId: string, file?: Express.Multer.File): Promise<string | null> {
    const avatar = await this.avatarModel.findOne({ userId });
    if (avatar) {
      return this.findFileAndGetBase64(avatar);
    }
    if (!file) {
      throw new NotFoundException(`Avatar (userId=${userId}) not found`);
    }
    return this.saveAvatar(userId, file);
  }

  private async saveAvatar(userId: string, file: Express.Multer.File): Promise<string> {
    const name: UUID = randomUUID();
    mkdirSync(this.baseDirectoryPath, { recursive: true });
    writeFileSync(this.baseDirectoryPath + name, file.buffer);
    const hashAlgorithm = createHash('md5');
    hashAlgorithm.update(file.buffer);
    const hash = hashAlgorithm.digest('hex');
    const avatar = new this.avatarModel({ userId, hash, name });
    await avatar.save();
    return file.buffer.toString('base64');
  }

  private findFileAndGetBase64(avatar: Avatar): string {
    const file: Buffer = readFileSync(this.baseDirectoryPath + avatar.name);
    if (!file) {
      throw new NotFoundException('file not found');
    }
    return file.toString('base64');
  }

  async deleteAvatar(userId: string) {
    const deletedAvatar = await this.avatarModel.findOneAndDelete({ userId });
    if (!deletedAvatar) {
      throw new NotFoundException(`Avatar (userId=${userId}) not found`);
    }
    rmSync(this.baseDirectoryPath + deletedAvatar.name);
  }

}
