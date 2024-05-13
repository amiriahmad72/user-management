import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailModule } from 'src/email/email.module';
import { AvatarService } from './avatar/avatar.service';
import { Avatar, AvatarSchema } from './avatar/entities/avatar.entity';
import { User, UserSchema } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Avatar.name, schema: AvatarSchema }]),
    EmailModule
  ],
  controllers: [UsersController],
  providers: [UsersService, AvatarService],
})
export class UsersModule { }
