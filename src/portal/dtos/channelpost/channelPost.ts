import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ChannelPost {
  @IsString()
  @IsNotEmpty()
  @Length(4, 20)
  newChannelName: string;
}
