import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { UUID } from 'crypto';
import { Document, HydratedDocument } from 'mongoose';

export type AvatarDocument = HydratedDocument<Avatar>;

@Schema()
export class Avatar {

  @Prop({ unique: true, required: true })
  userId: string;

  @Prop({ required: true })
  hash: string;

  @Prop({ unique: true, required: true })
  name: UUID;

}

export const AvatarSchema = SchemaFactory.createForClass(Avatar);