import {
  BadGatewayException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../model/entities/user.entity';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { ForgetPassword } from '../model/entities/forget-password.entity';
import { CreateUserDto } from '../model/dto/CreateUserDto';
import { hashPassword, matchPassword } from 'src/helpers/crypto';
import { ChangePasswordDto } from 'src/modules/auth/model/dto/ChangePasswordDto';
import { sendEmail } from 'src/helpers/sendMail';
import { changePasswordSuccessTemplate } from 'templates/change-password-success';
import { ConfigService } from '@nestjs/config';
import { PaginationParams } from 'src/helpers/params';
import { paginateData } from 'src/helpers/return-data-paginate';
import { welcomeTemplate } from 'templates/welcome';
import { UpdateUserDto } from '../model/dto/UpdateUserDto';
import { editFileName } from 'src/helpers/utils';
import { writeFileSync } from 'fs';
import { Workbook, Worksheet } from 'exceljs';
import { Response } from 'express';
import { PartnerState } from 'src/modules/partner-states/entities/partner-state.entity';
import { PartnerStatesService } from 'src/modules/partner-states/partner-states.service';
import { CredentialRole } from '../model/enum/role.enum';
import { LoginUserStateDto } from 'src/modules/auth/model/dto/login-user-state.dto';
import { SubCredentialRole } from '../model/enum/sub-role.enum';
import { InternalServerError } from 'src/shared/errors';
import {
  ConflictError,
  NotFoundUserError,
  UnauthorizedCredentialsError,
} from '../errors';

interface ParamsVerifyExistsUser {
  email: string;
  telephone: string;
  cpf: string;
  role: CredentialRole;
  partnerStateId?: number | null;
  userId?: number | null;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(ForgetPassword)
    private readonly forgetPasswordRepository: Repository<ForgetPassword>,

    private readonly partnerStateService: PartnerStatesService,

    private readonly configService: ConfigService,
  ) {}

  async updateAvatar(
    USU_ID: string,
    filename: string,
    base64: string,
    userAuth: User,
  ): Promise<string> {
    const user = await this.userRepository.findOne({
      where: {
        id: +USU_ID,
      },
    });
    const folderName = './public/user/avatar/';
    const newFileName = editFileName(filename);
    if (user) {
      user.image_profile = newFileName;
      writeFileSync(`${folderName}${newFileName}`, base64, {
        encoding: 'base64',
      });
      await this.userRepository.save(user, {
        data: userAuth,
      });
      return newFileName;
    } else {
      throw new BadGatewayException('Não é possível gravar esta imagem.');
    }
  }

  async create(dto: CreateUserDto, userAuth: User) {
    const {
      email,
      name,
      cpf,
      role,
      telephone,
      access_profile,
      idPartnerState,
    } = dto;

    const password = String(new Date());

    await this.verifyExistsUser({
      email,
      telephone,
      cpf,
      role,
      partnerStateId: idPartnerState,
    });

    const hashedPassword = await this.hashPassword(String(password));

    let partnerState: PartnerState;

    if (idPartnerState && role === CredentialRole.ESTADO) {
      partnerState = await this.partnerStateService.findOne(idPartnerState);
    }

    const user = this.userRepository.create({
      name,
      email,
      cpf,
      role,
      telephone,
      subRole: SubCredentialRole.ADMIN,
      password: hashedPassword,
      access_profile,
      partner_state: partnerState,
    });

    try {
      const userCreate = await user.save({
        data: userAuth,
      });

      this.welcomePasswordChangeLink(user.id);
      delete userCreate.password;

      return userCreate;
    } catch (e) {
      throw new InternalServerError();
    }
  }

  async verifyExistsUser(params: ParamsVerifyExistsUser): Promise<void> {
    const { email, telephone, cpf, role, partnerStateId, userId } = params;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.partner_state', 'partner_state')
      // .where('user.role = :role', { role: CredentialRole.PARC })
      .where(
        '(user.email = :email OR user.telephone = :telephone OR user.cpf = :cpf) AND user.role = :role',
        { email, telephone, cpf, role },
      );
    // .orWhere('user.telephone = :telephone', { telephone })
    // .orWhere('user.cpf = :cpf', { cpf })

    if (partnerStateId) {
      queryBuilder.andWhere('partner_state.id = :partnerStateId', {
        partnerStateId,
      });
    }

    if (userId) {
      queryBuilder.andWhere('user.id != :userId', {
        userId,
      });
    }

    const user = await queryBuilder.getOne();

    console.log(user);

    if (user) {
      throw new ConflictError();
    }
  }

  async update(
    idUser: number,
    dto: UpdateUserDto,
    userAuth: User,
  ): Promise<User> {
    let user = await this.findOne(idUser);

    let partnerState: PartnerState;

    if (dto?.idPartnerState) {
      partnerState = await this.partnerStateService.findOne(
        dto?.idPartnerState,
      );
    }

    await this.verifyExistsUser({
      cpf: dto?.cpf,
      email: dto?.email,
      telephone: dto?.telephone,
      role: CredentialRole.PARC,
      userId: idUser,
    });

    const formattedDto = {
      ...user,
      ...dto,
      partner_state: partnerState,
    };

    try {
      await this.userRepository.save(formattedDto, {
        data: userAuth,
      });

      user = await this.findOne(idUser);

      return user;
    } catch (e) {
      throw new InternalServerError();
    }
  }

  async welcomePasswordChangeLink(idUser: number): Promise<void> {
    const user = await this.findOne(idUser);

    let forgetPassword = await this.forgetPasswordRepository.findOne({
      where: {
        user: {
          id: idUser,
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

    let html = '';

    if (user.role === CredentialRole.PARC) {
      const forgotLink = `${this.configService.get(
        'FRONT_APP_URL',
      )}/nova-senha?token=${code}`;

      html = welcomeTemplate(
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

      html = welcomeTemplate(logo, forgotLink, color);
    }

    await this.forgetPasswordRepository.save(forgetPassword);

    await sendEmail(user.email, 'Parc | Seja Bem-vindo ao PARC!', html);
  }

  async checkCredentials(
    email: string,
    password: string,
    role: CredentialRole,
  ): Promise<User> {
    const userWithPassword = await this.userRepository.findOne({
      where: {
        email,
        role,
      },
      select: ['password'],
    });

    const user = await this.userRepository.findOne({
      where: {
        email,
        role,
      },
      relations: ['access_profile', 'access_profile.areas'],
    });

    if (user && matchPassword(password, userWithPassword.password)) {
      if (!user.active) {
        throw new ForbiddenException(
          'Seu usuário não tem permissão para acessar o sistema.',
        );
      }

      return user;
    } else {
      throw new UnauthorizedCredentialsError();
    }
  }

  async checkCredentialsUserState(
    dto: LoginUserStateDto,
    role: CredentialRole,
  ): Promise<User> {
    const { email, password, idPartnerState } = dto;

    const userWithPassword = await this.userRepository.findOne({
      where: {
        email,
        role,
      },
      select: ['password'],
    });

    const user = await this.userRepository.findOne({
      where: {
        email,
        role,
        partner_state: {
          id: idPartnerState,
        },
      },
      relations: [
        'access_profile',
        'access_profile.areas',
        'partner_state',
        'regionalPartner',
      ],
    });

    if (user && matchPassword(password, userWithPassword.password)) {
      if (!user.active) {
        throw new ForbiddenException(
          'Seu usuário não tem permissão para acessar o sistema.',
        );
      }
      return user;
    } else {
      throw new UnauthorizedCredentialsError();
    }
  }

  async findUserByEmail(email: string, role?: CredentialRole): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        email,
        role,
      },
      relations: ['partner_state', 'access_profile'],
    });

    if (!user) {
      throw new NotFoundUserError();
    }

    return user;
  }

  async changePassword(user: User, dto: ChangePasswordDto): Promise<boolean> {
    const { password, currentPassword } = dto;

    const userWithPassword = await this.userRepository.findOne({
      where: {
        id: user.id,
      },
      select: ['password', 'id'],
    });

    if (!matchPassword(currentPassword, userWithPassword.password)) {
      throw new UnauthorizedException('Por favor, cheque sua senha atual!');
    }

    await this.updatePassword(userWithPassword, password);

    return true;
  }

  async updatePassword(user: User, password: string): Promise<void> {
    const hashedPassword = this.hashPassword(String(password));

    const findUser = await this.findOne(user.id);

    findUser.password = hashedPassword;

    try {
      await this.userRepository.save(findUser);
    } catch (e) {
      throw new InternalServerError();
    }

    let html = '';

    if (findUser.role === CredentialRole.PARC) {
      html = changePasswordSuccessTemplate(
        this.configService.get('LOGO_TEMPLATE_EMAIL'),
        this.configService.get('FRONT_APP_URL'),
      );
    } else {
      const color = findUser.partner_state?.color;
      const logo = `${this.configService.get('URL_BD')}/users/avatar/${
        findUser?.partner_state?.logo
      }`;

      const url = `${this.configService.get('FRONT_APP_URL_ESTADO')}/painel/${
        findUser.partner_state?.slug
      }/login`;

      html = changePasswordSuccessTemplate(logo, url, color);
    }

    await sendEmail(
      findUser.email,
      'Parc | Você alterou sua senha de acesso',
      html,
    );
  }

  paginate(dto: PaginationParams) {
    const { page, limit, search, order, profile, status, role, partnerState } =
      dto;

    const queryBuilder = this.userRepository
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.access_profile', 'access_profile')
      .leftJoinAndSelect('users.partner_state', 'partner_state')
      .orderBy('users.name', order);

    if (role) {
      queryBuilder.andWhere('users.role = :role', { role });
    }

    if (status) {
      queryBuilder.andWhere('users.active = :status', { status });
    }

    if (profile) {
      queryBuilder.andWhere('access_profile.id = :idProfile', {
        idProfile: profile,
      });
    }

    if (partnerState) {
      queryBuilder.andWhere('partner_state.id = :idPartnerState', {
        idPartnerState: partnerState,
      });
    }

    if (search) {
      queryBuilder.andWhere('users.name LIKE :q', {
        q: `%${search}%`,
      });
    }

    return paginateData(+page, +limit, queryBuilder);
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
      relations: ['access_profile', 'partner_state', 'regionalPartner'],
    });

    if (!user) {
      throw new NotFoundUserError();
    }

    return user;
  }

  findAllByRole(role: CredentialRole): Promise<User[]> {
    return this.userRepository.find({
      where: {
        role,
      },
      order: {
        name: 'ASC',
      },
      relations: ['access_profile', 'partner_state'],
    });
  }

  async usersReportByExcel(
    paginationParams: PaginationParams,
    response: Response<unknown, Record<string, unknown>>,
  ): Promise<Worksheet> {
    const params = {
      ...paginationParams,
      role: CredentialRole.PARC,
      page: 1,
      limit: 9999999,
    };

    const { items: users } = await this.paginate(params as PaginationParams);

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Usuários Admin');

    worksheet.columns = [
      {
        header: 'id',
        key: 'id',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Nome',
        key: 'name',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'E-mail',
        key: 'email',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Perfil',
        key: 'profile',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Status',
        key: 'status',
        width: 20,
        style: { alignment: { horizontal: 'center' } },
      },
    ];

    users.forEach((user) => {
      worksheet.addRow({
        id: user.id,
        name: user?.name ?? '',
        email: user?.email ?? '',
        profile: user?.access_profile?.name ?? '',
        status: user.active ? 'Ativo' : 'Inativo',
      });
    });

    try {
      response.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      response.setHeader(
        'Content-Disposition',
        'attachment; filename=' + 'Relatório_de_usuarios.xlsx',
      );

      await workbook.xlsx.write(response, {
        filename: 'Relatório_de_usuarios.xlsx',
      });

      return worksheet;
    } catch (err) {
      console.log(err);
      throw new InternalServerError();
    }
  }

  async stateUsersReportByExcel(
    paginationParams: PaginationParams,
    response: Response<unknown, Record<string, unknown>>,
  ): Promise<Worksheet> {
    const params = {
      ...paginationParams,
      role: CredentialRole.ESTADO,
      page: 1,
      limit: 9999999,
    };

    const { items: users } = await this.paginate(params as PaginationParams);

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Usuários do Estado');

    worksheet.columns = [
      {
        header: 'id',
        key: 'id',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Nome',
        key: 'name',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'E-mail',
        key: 'email',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Estado',
        key: 'state',
        width: 30,
        style: { alignment: { horizontal: 'center' } },
      },
      {
        header: 'Status',
        key: 'status',
        width: 20,
        style: { alignment: { horizontal: 'center' } },
      },
    ];

    users.forEach((user) => {
      worksheet.addRow({
        id: user.id,
        name: user?.name ?? '',
        email: user?.email ?? '',
        profile: user?.access_profile?.name ?? '',
        state: user?.partner_state?.name ?? '',
        status: user.active ? 'Ativo' : 'Inativo',
      });
    });

    try {
      response.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      response.setHeader(
        'Content-Disposition',
        'attachment; filename=' + 'Relatório_de_usuarios_estado.xlsx',
      );

      await workbook.xlsx.write(response, {
        filename: 'Relatório_de_usuarios_estado.xlsx',
      });

      return worksheet;
    } catch (err) {
      console.log(err);
      throw new InternalServerError();
    }
  }

  private hashPassword(password: string): string {
    return hashPassword(password);
  }
}
