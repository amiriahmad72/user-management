import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Model, connect, connections } from 'mongoose';
import { EmailService } from '../email/email.service';
import { EventProducerService } from '../queue/event-producer/event-producer.service';
import { AvatarService } from './avatar/avatar.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserSchema } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let avatarService: AvatarService;
  let emailService: EmailService;
  let eventProducerService: EventProducerService;
  let mongod: MongoMemoryServer;
  let mockUserModel: Model<User>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const mongoUri = mongod.getUri();
    const mongoConnection = (await connect(mongoUri)).connection;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mongoConnection.model(User.name, UserSchema)
        },
        {
          provide: AvatarService,
          useValue: {
            findOrSaveAvatar: jest.fn(),
            deleteAvatarIfExists: jest.fn(),
            deleteAvatar: jest.fn()
          }
        },
        {
          provide: EmailService,
          useValue: {
            sendUserWelcome: jest.fn(),
          }
        },
        {
          provide: EventProducerService,
          useValue: {
            addUserToRegistrationQueue: jest.fn(),
          }
        }
      ],
    }).compile();

    service = module.get(UsersService);
    avatarService = module.get(AvatarService);
    emailService = module.get(EmailService);
    eventProducerService = module.get(EventProducerService);
    mockUserModel = module.get(getModelToken(User.name));
  });

  afterAll(async () => {
    for (let i in connections) {
      await connections[i].close();
    }
    await mongod.stop();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    for (let i in connections) {
      const collections = connections[i].collections;
      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
      }
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should return a user, send email and send rabbitMq event', async () => {
      const createUserDto: CreateUserDto = { firstName: 'dummyFirstName', lastName: 'dummyLastName', email: 'dummyEmail@mail.com' };
      expect(await service.create(createUserDto)).toMatchObject(createUserDto);
      expect(emailService.sendUserWelcome).toHaveBeenCalledTimes(1);
      expect(eventProducerService.addUserToRegistrationQueue).toHaveBeenCalledTimes(1);
    });
  });

  describe('create with already registered error', () => {
    it('should throw an exception', async () => {
      const email: string = 'dummyEmail@mail.com';
      // first registration
      const createUserDto1: CreateUserDto = { firstName: 'dummyFirstName1', lastName: 'dummyLastName1', email };
      expect(await service.create(createUserDto1)).toMatchObject(createUserDto1);
      expect(emailService.sendUserWelcome).toHaveBeenCalledTimes(1);
      expect(eventProducerService.addUserToRegistrationQueue).toHaveBeenCalledTimes(1);
      // second registration
      const createUserDto2: CreateUserDto = { firstName: 'dummyFirstName2', lastName: 'dummyLastName2', email };
      try {
        await service.create(createUserDto2);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
      }
      expect(emailService.sendUserWelcome).toHaveBeenCalledTimes(1);
      expect(eventProducerService.addUserToRegistrationQueue).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      // before any registration
      jest.spyOn(mockUserModel, 'find').mockResolvedValue([]);
      expect(await service.findAll()).toHaveLength(0);


      // register some dummy users
      const createUserDtoList: CreateUserDto[] = [];
      for (let index = 0; index < 10; index++) {
        createUserDtoList[index] = { firstName: `dummyFirstName${index}`, lastName: `dummyLastName${index}`, email: `dummyEmail${index}@mail.com` };
      }
      jest.spyOn(mockUserModel, 'find').mockResolvedValue(createUserDtoList);

      expect(await service.findAll()).toMatchObject(createUserDtoList);
    });
  });

  describe('findOne existing user', () => {
    it('should return a user', async () => {
      const createUserDto: CreateUserDto = { firstName: 'dummyFirstName', lastName: 'dummyLastName', email: 'dummyEmail@mail.com' };
      jest.spyOn(mockUserModel, 'findOne').mockResolvedValue(createUserDto);
      expect(await service.findOne('dummy-id')).toMatchObject(createUserDto);
    });
  });

  describe('findOne non-existing user', () => {
    it('should throw NotFoundException', async () => {
      jest.spyOn(mockUserModel, 'findOne').mockResolvedValue(undefined);
      try {
        await service.findOne('dummy-id');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });
  });

  describe('update existing user', () => {
    it('should return an updated user', async () => {
      const updateUserDto: UpdateUserDto = { firstName: 'dummyFirstName', lastName: 'dummyLastName', email: 'dummyEmail@mail.com' };
      jest.spyOn(mockUserModel, 'findByIdAndUpdate').mockResolvedValue(updateUserDto);
      expect(await service.update('dummy-id', updateUserDto)).toMatchObject(updateUserDto);
    });
  });

  describe('update non-existing user', () => {
    it('should throw NotFoundException', async () => {
      const updateUserDto: UpdateUserDto = { firstName: 'dummyFirstName', lastName: 'dummyLastName', email: 'dummyEmail@mail.com' };
      jest.spyOn(mockUserModel, 'findByIdAndUpdate').mockResolvedValue(undefined);
      try {
        await service.update('dummy-id', updateUserDto);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });
  });

  describe('remove existing user', () => {
    it('should return a deleted user', async () => {
      const user: User = { firstName: 'dummyFirstName', lastName: 'dummyLastName', email: 'dummyEmail@mail.com' };
      jest.spyOn(mockUserModel, 'findByIdAndDelete').mockResolvedValue(user);
      expect(await service.remove('dummy-id')).toMatchObject(user);
      expect(avatarService.deleteAvatarIfExists).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove non-existing user', () => {
    it('should throw NotFoundException', async () => {
      jest.spyOn(mockUserModel, 'findByIdAndDelete').mockResolvedValue(undefined);
      try {
        await service.remove('dummy-id');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(avatarService.deleteAvatarIfExists).toHaveBeenCalledTimes(0);
      }
    });
  });

});
