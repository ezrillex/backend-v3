import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class UpdateVideoDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(0, 5000) // this is yt limit :v
  description: string;

  //todo allow updating the thumbnail
}
