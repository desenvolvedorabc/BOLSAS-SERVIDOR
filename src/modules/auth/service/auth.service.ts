import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { UserService } from '../../user/service/user.service';
import { ForgetPassword } from 'src/modules/user/model/entities/forget-password.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginUserDto } from '../model/dto/LoginUserDto';
import { PayloadType } from '../strategy/jwt.strategy';
import { sendEmail } from 'src/helpers/sendMail';
import { forgetPasswordTemplate } from 'templates/forget-password';
import { ForgotPasswordDto } from '../model/dto/ForgotPasswordDto';
import { ResetPasswordDto } from '../model/dto/reset-password.dto';
import { ConfigService } from '@nestjs/config';
import { CredentialRole } from 'src/modules/user/model/enum/role.enum';
import { LoginUserStateDto } from '../model/dto/login-user-state.dto';
import { ResponseLogin } from '../model/interfaces/response-login.interface';
import { User } from 'src/modules/user/model/entities/user.entity';
import { isPast } from 'date-fns';
import { ForgotPasswordUserStateDto } from '../model/dto/forgot-password-user-state.dto';
import { ForbiddenError } from 'src/shared/errors';
import { ScholarsService } from 'src/modules/scholars/scholars.service';
import { SubCredentialRole } from 'src/modules/user/model/enum/sub-role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly scholarsService: ScholarsService,
    private readonly jwtService: JwtService,

    @InjectRepository(ForgetPassword)
    private readonly forgetPasswordRepository: Repository<ForgetPassword>,

    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginUserDto): Promise<ResponseLogin> {
    const { email, password } = dto;
    const user = await this.userService.checkCredentials(
      email,
      password,
      CredentialRole.PARC,
    );

    delete user.password;
    const token = this.generateTokenByIdUser(user.id);

    return {
      user,
      token,
    };
  }

  async loginUserState(dto: LoginUserStateDto): Promise<ResponseLogin> {
    const user = await this.userService.checkCredentialsUserState(
      dto,
      CredentialRole.ESTADO,
    );

    delete user.password;
    const token = this.generateTokenByIdUser(user.id);

    if (user.subRole !== SubCredentialRole.BOLSISTA) {
      return {
        user,
        token,
      };
    }

    const { scholar } = await this.scholarsService.me(user, []);

    return {
      user: {
        ...user,
        isFormer: !!scholar?.isFormer,
      },
      token,
    };
  }

  private generateTokenByIdUser(id: number): string {
    const payload: PayloadType = { id };
    const token = this.jwtService.sign(payload);

    return token;
  }

  async forgotPasswordUserParc(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<void> {
    const user = await this.userService.findUserByEmail(
      forgotPasswordDto.email,
      CredentialRole.PARC,
    );

    if (!user.active) {
      throw new ForbiddenException(
        'Seu usuário não tem permissão para acessar o sistema.',
      );
    }

    await this.forgotPassword(user);
  }

  async forgotPasswordUserState(
    forgotPasswordDto: ForgotPasswordUserStateDto,
  ): Promise<void> {
    const { email, idPartnerState } = forgotPasswordDto;

    const user = await this.userService.findUserByEmail(
      email,
      CredentialRole.ESTADO,
    );

    if (user?.partner_state.id !== idPartnerState) {
      throw new ForbiddenError();
    }

    if (!user.active) {
      throw new ForbiddenException(
        'Seu usuário não tem permissão para acessar o sistema.',
      );
    }

    await this.forgotPassword(user);
  }

  private async forgotPassword(user: User): Promise<void> {
    let forgetPassword = await this.forgetPasswordRepository.findOne({
      where: {
        user: {
          id: user.id,
        },
      },
      relations: ['user'],
    });

    const code = crypto.randomUUID().substring(0, 6);

    if (!forgetPassword) {
      forgetPassword = this.forgetPasswordRepository.create({
        token: code,
        isValid: true,
        user,
      });
    } else {
      forgetPassword.token = code;
      forgetPassword.isValid = true;
    }

    await this.forgetPasswordRepository.save(forgetPassword);

    let html = '';

    if (user.role === CredentialRole.PARC) {
      const forgotLink = `${this.configService.get(
        'FRONT_APP_URL',
      )}/nova-senha?token=${code}`;

      html = forgetPasswordTemplate(
        this.configService.get('LOGO_TEMPLATE_EMAIL'),
        forgotLink,
      );
    } else {
      const color = user.partner_state?.color;
      const logo = `${this.configService.get('URL_BD')}/users/avatar/${
        user?.partner_state?.logo
      }`;

      const forgotLink = `${this.configService.get(
        'FRONT_APP_URL_ESTADO',
      )}/painel/${user.partner_state?.slug}/nova-senha?token=${code}`;

      html = forgetPasswordTemplate(logo, forgotLink, color);
    }

    await sendEmail(user.email, 'Parc | Pedido de redefinição de senha', html);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const { password, token } = dto;

    const findUserByToken = await this.forgetPasswordRepository.findOne({
      where: {
        token,
      },
      relations: ['user'],
    });

    const oldDate = new Date(findUserByToken.updatedAt);
    const date = new Date(findUserByToken.updatedAt);

    date.setHours(oldDate.getHours() + 8);

    if (!findUserByToken || !findUserByToken.isValid || isPast(date)) {
      throw new BadRequestException('Token inválido');
    }

    await this.userService.updatePassword(findUserByToken.user, password);

    if (!findUserByToken.user.isChangePasswordWelcome) {
      const user = findUserByToken.user;

      user.isChangePasswordWelcome = true;

      await user.save();
    }

    findUserByToken.isValid = false;

    await this.forgetPasswordRepository.save(findUserByToken);
  }
}
