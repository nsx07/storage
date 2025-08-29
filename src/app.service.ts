import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private config: ConfigService) {}

  getHello(): string {
    return 'Hello World!';
  }

  validateTokenProvider(token: string) {
    if (!token) {
      return {
        success: false,
        code: 'Unauthorized',
        message: 'Token is missing',
      };
    }

    if (token != this.config.get('STORAGE_TOKEN')) {
      return {
        success: false,
        code: 'Unauthorized',
        message: 'Token is invalid',
      };
    }

    return { success: true, code: 'Authorized', message: 'Token validated' };
  }
}
