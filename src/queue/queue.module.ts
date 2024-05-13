import { Module } from '@nestjs/common';
import { EventProducerService } from './event-producer/event-producer.service';

@Module({
  providers: [EventProducerService],
  exports: [EventProducerService]
})
export class QueueModule { }
