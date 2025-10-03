import { IsBase64, IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateVideoPost {
  @IsString()
  @IsNotEmpty()
  @Length(0, 5000) // this is yt limit :v
  description: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 150) // 100 is yt limit, await feedback on this?
  title: string;

  @IsString()
  @IsNotEmpty()
  @IsBase64()
  thumbnail: string;
}
