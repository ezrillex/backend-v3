import { IsNotEmpty, IsString, Length } from 'class-validator';

export class UpdateChannel {
  @IsString()
  @IsNotEmpty()
  @Length(4, 20)
  newChannelName: string;
}
