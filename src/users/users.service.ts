import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MongoServerError } from 'mongodb';
import { Model } from 'mongoose';
import { EmailService } from 'src/email/email.service';
import { EventProducerService } from 'src/queue/event-producer/event-producer.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { AvatarService } from './avatar/avatar.service';

@Injectable()
export class UsersService {

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly avatarService: AvatarService,
    private readonly emailService: EmailService,
    private readonly eventProducerService: EventProducerService
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    let savedUser: User;
    try {
      savedUser = await createdUser.save();
    } catch (error) {
      if (error instanceof MongoServerError) {
        let mongoServerError: MongoServerError = error;
        if (mongoServerError.code == 11000) {
          throw new ConflictException("email is already registered");
        }
      }
      throw error;
    }
    this.emailService.sendUserWelcome(savedUser);
    this.eventProducerService.addUserToRegistrationQueue(savedUser);
    return savedUser;
  }

  findAll(): Promise<User[]> {
    return this.userModel.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException(`User (id=${id}) not found`)
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const updatedUser = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true });
    if (!updatedUser) {
      throw new NotFoundException(`User (id=${id}) not found`)
    }
    return updatedUser;
  }

  async remove(id: string): Promise<User> {
    await this.avatarService.deleteAvatarIfExists(id);
    const deletedUser = await this.userModel.findByIdAndDelete(id);
    if (!deletedUser) {
      throw new NotFoundException(`User (id=${id}) not found`)
    }
    return deletedUser;
  }

}
