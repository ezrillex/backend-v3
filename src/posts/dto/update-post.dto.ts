import { PartialType } from '@nestjs/mapped-types';
import { CreateVideoRepost } from './create-video.repost';

export class UpdatePostDto extends PartialType(CreateVideoRepost) {}
