import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { Channel } from 'amqplib';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class EventProducerService implements OnModuleInit {
  private channelWrapper: ChannelWrapper;

  constructor(private readonly configService: ConfigService) { }

  async onModuleInit() {
    const connection = amqp.connect(this.configService.get<string>('RABBITMQ_URL'));
    this.channelWrapper = connection.createChannel({
      setup: (channel: Channel) => {
        return channel.assertQueue('user-reqisteration-queue', { durable: true });
      },
    });
  }

  async addUserToRegistrationQueue(user: User) {
    this.channelWrapper.sendToQueue(
      'user-reqisteration-queue',
      Buffer.from(JSON.stringify(user)),
      {
        persistent: true,
      }
    );
  }

}
