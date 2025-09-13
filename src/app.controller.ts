import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from './auth/auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('home')
  async getHome(): Promise<object> {
    return this.appService.getHomePage();
  }
  @UseGuards(AuthGuard)
  @Post('testauth')
  getTestAuth(@Req() request: { channel: object; auth: object }) {
    console.log(request['channel']);
    console.log(request['auth']);
    return 'you got a reply!';
  }
}
