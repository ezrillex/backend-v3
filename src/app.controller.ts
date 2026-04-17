import { Controller, Get, Req, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { AllowAnonymous, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { AddChannelInterceptor } from './auth/AddChannel/AddChannel.interceptor';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @AllowAnonymous()
  @Get('home')
  async getHome() {
    return this.appService.getHomePage();
  }

  // @UseInterceptors(AddChannelInterceptor)
  // @AllowAnonymous()
  // @Get('dev')
  // async dev(@Session() session: UserSession, @Req() req: Request) {
  //   // console.log(session);
  //   // console.log(req);
  // }
}
