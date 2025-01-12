import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('validateToken')
  validateToken(@Query('token') token: string) {
    return this.appService.validateTokenProvider(token);
  }
}
