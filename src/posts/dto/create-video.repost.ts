import {
  IsBase64,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';
// import { VideoTypes } from 'generated/prisma';

export class CreateVideoRepost {
  // @IsString()
  // @IsNotEmpty()
  // @IsEnum(VideoTypes)
  // type: VideoTypes;

  @IsString()
  @IsNotEmpty()
  // @IsUrl()
  youtubeVideoID: string;

  @IsString()
  @IsNotEmpty()
  @Length(0, 1024)
  description: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 256)
  title: string;

  @IsString()
  @IsNotEmpty()
  @IsBase64()
  thumbnail: string;

  // duration and kilobytes need to be server side figured out?
}
