import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EventProducerService } from './event-producer.service';

describe('EventProducerService', () => {
  let service: EventProducerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventProducerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              return null;
            })
          }
        },
      ],
    }).compile();

    service = module.get<EventProducerService>(EventProducerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
