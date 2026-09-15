import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { OptionalAuth } from '@thallesp/nestjs-better-auth';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @OptionalAuth()
  getHello(): string {
    return this.appService.getHello();
  }
}
