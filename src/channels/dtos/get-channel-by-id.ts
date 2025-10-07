import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class GetChannelById {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  id: string;
}
