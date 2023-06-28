import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ForgotPasswordUserStateDto } from '../model/dto/forgot-password-user-state.dto';
import { ForgotPasswordDto } from '../model/dto/ForgotPasswordDto';
import { LoginUserStateDto } from '../model/dto/login-user-state.dto';
import { LoginUserDto } from '../model/dto/LoginUserDto';
import { ResetPasswordDto } from '../model/dto/reset-password.dto';
import { ResponseLogin } from '../model/interfaces/response-login.interface';
import { AuthService } from '../service/auth.service';

@Controller('auth')
@ApiTags('Autenticação')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/login')
  login(@Body() loginUserDto: LoginUserDto): Promise<ResponseLogin> {
    return this.authService.login(loginUserDto);
  }

  @Post('/login/parc')
  loginUserParc(@Body() loginUserDto: LoginUserDto): Promise<ResponseLogin> {
    return this.authService.login(loginUserDto);
  }

  @Post('/login/state')
  loginUserState(
    @Body() loginUserStateDto: LoginUserStateDto,
  ): Promise<ResponseLogin> {
    return this.authService.loginUserState(loginUserStateDto);
  }

  @Post('/forgot-password')
  forgotPasswordUserParc(@Body() dto: ForgotPasswordDto): Promise<void> {
    return this.authService.forgotPasswordUserParc(dto);
  }

  @Post('/forgot-password/state')
  forgotPasswordUserState(
    @Body() dto: ForgotPasswordUserStateDto,
  ): Promise<void> {
    return this.authService.forgotPasswordUserState(dto);
  }

  @Post('/reset-password')
  resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    return this.authService.resetPassword(dto);
  }
}
