import { Controller, Post } from '@nestjs/common';
import { ManagedFilesService } from './managed-files.service';

@Controller('managed-files')
export class ManagedFilesController {
  constructor(private readonly managedFilesService: ManagedFilesService) {}

  @Post()
  test() {
    //return this.managedFilesService.createManagedFile('prefijo', 'text/plain');
  }
}
