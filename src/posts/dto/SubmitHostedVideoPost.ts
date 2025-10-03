import {
  IsBase64,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class SubmitHostedVideoPost {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsNumber()
  @IsInt()
  @Min(1)
  duration: number;

  @IsString()
  @IsNotEmpty()
  @IsBase64()
  torrent: string;
}
