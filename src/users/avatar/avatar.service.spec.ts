import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID, randomUUID } from 'crypto';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Model, connect, connections } from 'mongoose';
import { Readable } from 'stream';
import { AvatarService } from './avatar.service';
import { Avatar, AvatarSchema } from './entities/avatar.entity';

const UPLOADED_AVATARS_PATH = '/tmp/avatars/';

describe('AvatarService', () => {
  let service: AvatarService;
  let mongod: MongoMemoryServer;
  let mockAvatarModel: Model<Avatar>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const mongoUri = mongod.getUri();
    const mongoConnection = (await connect(mongoUri)).connection;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvatarService,
        {
          provide: getModelToken(Avatar.name),
          useValue: mongoConnection.model(Avatar.name, AvatarSchema)
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key == 'UPLOADED_AVATARS_PATH') {
                return UPLOADED_AVATARS_PATH;
              }
              return null;
            })
          }
        },
      ],
    }).compile();

    service = module.get(AvatarService);
    mockAvatarModel = module.get(getModelToken(Avatar.name));
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

  describe('findOrSaveAvatar before uplad any avatar', () => {
    it('should throw NotFoundException', async () => {
      jest.spyOn(mockAvatarModel, 'findOne').mockResolvedValue(undefined);
      try {
        await service.findOrSaveAvatar('dummy-id');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });
  });

  describe('findOrSaveAvatar uplad a new avatar', () => {
    it('should return a base64', async () => {
      jest.spyOn(mockAvatarModel, 'findOne').mockResolvedValue(undefined);
      const fileValue = 'dummy-value1';

      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'dummy-name',
        encoding: 'dummy-encodding',
        mimetype: 'image/**',
        size: 100,
        stream: new Readable(),
        destination: 'dummy-destination',
        filename: "dummy-name",
        path: "dummy-path",
        buffer: Buffer.from(fileValue)
      };

      const base64 = Buffer.from(fileValue).toString('base64');
      expect(await service.findOrSaveAvatar('dummy-id', file)).toBe(base64);
    });
  });

  describe('findOrSaveAvatar get already uploaded avatar', () => {
    it('should return a base64', async () => {
      let name: UUID = randomUUID();
      const avatar: Avatar = { userId: 'dummy-id', hash: 'dummy-hash', name };
      jest.spyOn(mockAvatarModel, 'findOne').mockResolvedValue(avatar);

      const fileValue = 'dummy-value1';
      mkdirSync(UPLOADED_AVATARS_PATH, { recursive: true });
      writeFileSync(UPLOADED_AVATARS_PATH + name, Buffer.from(fileValue));

      const base64 = Buffer.from(fileValue).toString('base64');
      expect(await service.findOrSaveAvatar('dummy-id')).toBe(base64);
    });
  });

  describe('findOrSaveAvatar get already uploaded avatar but missing file', () => {
    it('should throw NotFoundException', async () => {
      let name: UUID = randomUUID();
      const avatar: Avatar = { userId: 'dummy-id', hash: 'dummy-hash', name };
      jest.spyOn(mockAvatarModel, 'findOne').mockResolvedValue(avatar);

      try {
        await service.findOrSaveAvatar('dummy-id');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });
  });

  describe('deleteAvatarIfExists', () => {
    it('should remove existing file', async () => {
      let name: UUID = randomUUID();
      const avatar: Avatar = { userId: 'dummy-id', hash: 'dummy-hash', name };
      jest.spyOn(mockAvatarModel, 'findOneAndDelete').mockResolvedValue(avatar);

      const fileValue = 'dummy-value1';
      mkdirSync(UPLOADED_AVATARS_PATH, { recursive: true });
      const filePath = UPLOADED_AVATARS_PATH + name;
      writeFileSync(filePath, Buffer.from(fileValue));

      await service.deleteAvatarIfExists('dummy-id');
      expect(mockAvatarModel.findOneAndDelete).toHaveBeenNthCalledWith(1, {'userId': 'dummy-id'});
      expect(existsSync(filePath)).toBeFalsy();
    });
  });

  describe('deleteAvatar for existing one', () => {
    it('should remove existing file', async () => {
      let name: UUID = randomUUID();
      const avatar: Avatar = { userId: 'dummy-id', hash: 'dummy-hash', name };
      jest.spyOn(mockAvatarModel, 'findOneAndDelete').mockResolvedValue(avatar);

      const fileValue = 'dummy-value1';
      mkdirSync(UPLOADED_AVATARS_PATH, { recursive: true });
      const filePath = UPLOADED_AVATARS_PATH + name;
      writeFileSync(filePath, Buffer.from(fileValue));

      await service.deleteAvatar('dummy-id');
      expect(mockAvatarModel.findOneAndDelete).toHaveBeenNthCalledWith(1, {'userId': 'dummy-id'});
      expect(existsSync(filePath)).toBeFalsy();
    });
  });


  describe('deleteAvatar for non-existing one', () => {
    it('should throw NotFoundException', async () => {
      try {
        jest.spyOn(mockAvatarModel, 'findOneAndDelete').mockResolvedValue(undefined);
        await service.deleteAvatar('dummy-id');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }      
    });
  });

});
