import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Get,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { SetUsernameDto } from '../dto/set-username.dto';
import { UsernameService } from '../services/username.service';
import { JwtSessionGuard } from '../../user/guards/jwt-session.guard';

@Controller('username')
export class UsernameController {
  constructor(private usernameService: UsernameService) {}

  @Post('set')
  @UseGuards(JwtSessionGuard)
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async setUsername(@Req() req: Request, @Body() dto: SetUsernameDto) {
    const isSearchable = dto.isSearchable === 'yes';
    await this.usernameService.setUsername(req.user!.id, dto.username, isSearchable);
    return { success: true, message: 'Username updated successfully' };
  }

  @Get('search/:username')
  @HttpCode(HttpStatus.OK)
  async search(@Param('username') username: string) {
    const user = await this.usernameService.findUserByUsername(username);
    if (!user) {
      return { found: false };
    }
    return {
      found: true,
      user: {
        id: user.id,
        publicKey: user.publicKey,
        displayName: user.displayName,
      },
    };
  }
}
