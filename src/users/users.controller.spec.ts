import { Test, TestingModule } from '@nestjs/testing';
import { AvatarService } from './avatar/avatar.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {

  let controller: UsersController;
  let userService: UsersService;
  let avatarService: AvatarService;
  const MOCK_USER = { _id: 'test-id', firstName: 'testFirstName', lastName: 'testLastName', email: 'test@mail.com' };
  const DUMMY_BASE64 = 'dummy-base64';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(async (createUserDto: CreateUserDto) => {
              return createUserDto;
            }),
            findAll: jest.fn(async () => {
              return [MOCK_USER];
            }),
            findOne: jest.fn(async (id: string) => {
              return MOCK_USER;
            }),
            update: jest.fn(async (id: string, createUserDto: CreateUserDto) => {
              return createUserDto;
            }),
            remove: jest.fn(async (id: string) => {
              return MOCK_USER;
            })
          }
        },
        {
          provide: AvatarService,
          useValue: {
            findOrSaveAvatar: jest.fn(async (id: string, file: Express.Multer.File) => { return DUMMY_BASE64; }),
            deleteAvatarIfExists: jest.fn(),
            deleteAvatar: jest.fn()
          }
        }
      ],
    }).compile();

    controller = module.get(UsersController);
    userService = module.get(UsersService);
    avatarService = module.get(AvatarService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should return a user', async () => {
      const createUserDto: CreateUserDto = { firstName: 'dummyFirstName', lastName: 'dummyLastName', email: 'dummyEmail@mail.com' };
      expect(await controller.create(createUserDto)).toBe(createUserDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      expect(await controller.findAll()).toStrictEqual([MOCK_USER]);
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      expect(await controller.findOne('dummy-id')).toBe(MOCK_USER);
    });
  });

  describe('update', () => {
    it('should return a user', async () => {
      const createUserDto: CreateUserDto = { firstName: 'updatedFirstName', lastName: 'updatedLastName', email: 'updatedEmail@mail.com' };
      expect(await controller.update('dummy-id', createUserDto)).toBe(createUserDto);
    });
  });

  describe('remove', () => {
    it('should return a user', async () => {
      expect(await controller.remove('dummy-id')).toBe(MOCK_USER);
    });
  });

  describe('findOrSaveAvatar', () => {
    it('should return a base64', async () => {
      expect(await controller.findOrSaveAvatar('dummy-id')).toBe(DUMMY_BASE64);
    });
  });

  describe('deleteAvatar', () => {
    it('should call avatarService.deleteAvatar', async () => {
      await controller.deleteAvatar('dummy-id');
      expect(avatarService.deleteAvatar).toHaveBeenCalledTimes(1);
    });
  });

});
