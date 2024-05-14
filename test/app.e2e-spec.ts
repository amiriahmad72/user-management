import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { connections } from 'mongoose';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    for (let i in connections) {
      await connections[i].close();
    }
    await app.close();
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

  it('/users (GET)', () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(200)
      .expect('[]');
  });

  it('should return a user, send email and send rabbitMq event', async () => {
    const createUserDto: CreateUserDto = { firstName: 'dummyFirstName', lastName: 'dummyLastName', email: 'dummyEmail@mail.com' };
    return request(app.getHttpServer())
      .post('/users').send(createUserDto)
      .expect(201)
      .expect((response) => response.body == createUserDto);
  });

});
