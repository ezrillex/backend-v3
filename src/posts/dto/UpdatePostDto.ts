import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTextPost } from './createTextPost';
import { UpdateVideoDto } from './UpdateVideoDto';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(1, 150) // 100 is yt limit, await feedback on this?
  title?: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateVideoDto)
  video?: UpdateVideoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateTextPost)
  text?: CreateTextPost; // todo temporary, change if this dto changes, todo DO ONE THAT HAS '?'
}
