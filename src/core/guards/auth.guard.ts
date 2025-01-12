import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.token;
    const bypass = this.configService.get('BYPASS');

    if (bypass === 'true') return true;

    if (token === this.configService.get('STORAGE_TOKEN')) {
      return true;
    }

    throw new UnauthorizedException('Invalid token');
  }
}
