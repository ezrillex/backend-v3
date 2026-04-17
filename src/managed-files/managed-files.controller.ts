import { Controller, Post } from '@nestjs/common';
import { ManagedFilesService } from './managed-files.service';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@Controller('managed-files')
export class ManagedFilesController {
  constructor(private readonly managedFilesService: ManagedFilesService) {}

  @AllowAnonymous()
  @Post('dev')
  dev() {
    return this.managedFilesService.syncManagedFiles();
    // return this.managedFilesService.cleanupUnusedFiles();
  }
}
