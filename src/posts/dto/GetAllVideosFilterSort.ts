import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { PostTypes } from '@prisma/client';
import { SortBy } from '../entities/sortBy.enum';
import { SortOrder } from '../entities/sortOrder.enum';

export class GetAllVideosFilterSort {
  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(0)
  page: number;

  @IsOptional()
  @IsString()
  @IsUUID()
  channel?: string;

  @IsOptional()
  @IsEnum(PostTypes, { each: true })
  type: PostTypes[]; // so ?type=Video&type=Image etc..

  @IsOptional()
  @IsEnum(SortBy)
  sortBy: SortBy;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder: SortOrder;
}
