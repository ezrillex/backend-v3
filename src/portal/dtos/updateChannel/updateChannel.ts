import {
  IsBase64,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class UpdateChannel {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(4, 20)
  newChannelName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsBase64()
  newThumbnail?: string;
}
