import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  Put,
} from '@nestjs/common';
import { TermsOfMembershipService } from './terms-of-membership.service';
import { CreateTermsOfMembershipDto } from './dto/create-terms-of-membership.dto';
import { UpdateTermsOfMembershipDto } from './dto/update-terms-of-membership.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { User } from '../user/model/entities/user.entity';
import { GetUser } from '../auth/decorator/current-user.decorator';
import { PaginationTermsOfMembership } from './dto/pagination-terms-membership.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Controller('terms-of-membership')
@ApiTags('Termos de Adesão')
export class TermsOfMembershipController {
  constructor(
    private readonly termsOfMembershipService: TermsOfMembershipService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(
    @Body() createTermsOfMembershipDto: CreateTermsOfMembershipDto,
    @GetUser() user: User,
  ): Promise<void> {
    return this.termsOfMembershipService.create(
      createTermsOfMembershipDto,
      user,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findAll(
    @Query() paginationParams: PaginationTermsOfMembership,
    @GetUser() user: User,
  ) {
    return this.termsOfMembershipService.findAll(paginationParams, user);
  }

  @Get('general-search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  generalSearch(
    @Query() paginationParams: PaginationTermsOfMembership,
    @GetUser() user: User,
  ) {
    return this.termsOfMembershipService.generalSearch(paginationParams, user);
  }

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  me(@GetUser() user: User) {
    return this.termsOfMembershipService.me(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.termsOfMembershipService.findOne(+id);
  }

  @Patch('/me/to-sign')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/terms',
        filename: (req, file, cb) => {
          return cb(null, `${Date.now()}-${file.originalname}`);
        },
      }),
    }),
  )
  toSign(
    @GetUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<void> {
    return this.termsOfMembershipService.toSign(user, file);
  }

  @Patch('/me/to-cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/terms',
        filename: (req, file, cb) => {
          return cb(null, `${Date.now()}-${file.originalname}`);
        },
      }),
    }),
  )
  toCancel(
    @GetUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<void> {
    return this.termsOfMembershipService.toCancel(user, file);
  }

  @Patch('/:id/inactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  approve(@Param('id') id: number): Promise<void> {
    return this.termsOfMembershipService.inactivate(+id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(
    @Param('id') id: string,
    @Body() updateTermsOfMembershipDto: UpdateTermsOfMembershipDto,
    @GetUser() user: User,
  ) {
    return this.termsOfMembershipService.update(
      +id,
      updateTermsOfMembershipDto,
      user,
    );
  }

  @Get('/terms/:file')
  seeUploadedAvatar(@Param('file') image: string, @Res() res) {
    return res.sendFile(image, { root: './public/terms' });
  }
}
