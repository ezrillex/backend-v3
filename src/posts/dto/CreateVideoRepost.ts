import {
  IsBase64,
  IsNotEmpty,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateVideoRepost {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  youtubeVideoID: string;
  // validated through data api to get duration again. RESULTS IS 1 OR 0 (invalid). always get 200 ok from api.

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
