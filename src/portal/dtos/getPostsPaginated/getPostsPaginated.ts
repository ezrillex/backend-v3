import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetPostsPaginated {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page: number;
}
