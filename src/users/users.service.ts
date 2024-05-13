import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Model } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  create(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  findAll(): Promise<User[]> {
    return this.userModel.find();
  }

  findOne(id: string) {
    const user = this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException(`Useer (id=${id}) not found`)
    }
    return user;
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    const updatedUser = this.userModel.findByIdAndUpdate(id, updateUserDto, {new: true});
    if (!updatedUser) {
      throw new NotFoundException(`Useer (id=${id}) not found`)
    }
    return updatedUser;
  }

  remove(id: string) {
    const deletedUser = this.userModel.findByIdAndDelete(id);
    if (!deletedUser) {
      throw new NotFoundException(`Useer (id=${id}) not found`)
    }
    return deletedUser;
  }
}
