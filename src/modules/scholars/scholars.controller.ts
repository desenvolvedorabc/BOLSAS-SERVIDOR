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
  UploadedFiles,
  Put,
  Res,
} from '@nestjs/common';
import { CreateScholarDto } from './dto/create-scholar.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { GetUser } from '../auth/decorator/current-user.decorator';
import { User } from '../user/model/entities/user.entity';
import { PaginationParams } from 'src/helpers/params';
import { ScholarsService } from './scholars.service';
import { CreateCompletedScholarDto } from './dto/create-completed-scholar.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Scholar } from './entities/scholar.entity';
import { ReproveScholarDto } from './dto/reprove-scholar.dto';
import { ApproveScholarDto } from './dto/approve-scholar.dto';
import { UpdateCompletedScholarDto } from './dto/update-completed-scholar.dto';
import { FilesScholar } from './interfaces/files-scholar.interface';
import { ChangeAdminScholarDto } from './dto/change-admin-scholar.dto';
import { UpdateScholarDto } from './dto/update-scholar.dto';

@Controller('scholars')
@ApiTags('Bolsistas')
export class ScholarsController {
  constructor(private readonly scholarsService: ScholarsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Body() createScholarDto: CreateScholarDto, @GetUser() user: User) {
    return this.scholarsService.create(createScholarDto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findAll(@Query() paginationParams: PaginationParams, @GetUser() user: User) {
    return this.scholarsService.getAllInPreRegistration(paginationParams, user);
  }

  @Get('general-search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  generalSearch(
    @Query() paginationParams: PaginationParams,
    @GetUser() user: User,
  ) {
    return this.scholarsService.generalSearch(paginationParams, user);
  }

  @Get('/terms-of-membership/all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getScholarsForTermsOfMembership(
    @Query() paginationParams: PaginationParams,
    @GetUser() user: User,
  ) {
    return this.scholarsService.getScholarsForTermsOfMembership(
      paginationParams,
      user,
    );
  }

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  me(@GetUser() user: User) {
    return this.scholarsService.me(user);
  }

  @Get('/:id/with-user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findOneByUser(@Param('id') id: number) {
    return this.scholarsService.findOneByUser(+id, []);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findOne(@Param('id') id: number): Promise<Scholar> {
    return this.scholarsService.findOneByReport(+id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('/:id/with-user')
  updateWithUser(
    @GetUser() user: User,
    @Param('id') id: number,
    @Body() dto: UpdateScholarDto,
  ): Promise<void> {
    return this.scholarsService.updateWithUser(id, dto, user);
  }

  @Post('/completed-registration')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'copyRgFrontAndVerse', maxCount: 1 },
        { name: 'copyCpfFrontAndVerse', maxCount: 1 },
        { name: 'curriculumVitae', maxCount: 1 },
        { name: 'copyHigherTitle', maxCount: 1 },
        { name: 'currentAccountCopy', maxCount: 1 },
        { name: 'proofOfAddress', maxCount: 1 },
        { name: 'medicalCertificate', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './public/file',
          filename: (req, file, cb) => {
            return cb(null, `${Date.now()}-${file.originalname}`);
          },
        }),
      },
    ),
  )
  completedScholar(
    @Body() createCompletedScholarDto: CreateCompletedScholarDto,
    @GetUser() user: User,
    @UploadedFiles() files: FilesScholar,
  ) {
    return this.scholarsService.completedScholar(
      createCompletedScholarDto,
      user,
      files,
    );
  }

  @Post('/:id/change-admin-for-scholar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  changeAdminScholar(
    @Param('id') id: number,
    @Body() changeAdminScholarDto: ChangeAdminScholarDto,
    @GetUser() user: User,
  ) {
    return this.scholarsService.changeAdminScholar(
      id,
      changeAdminScholarDto,
      user,
    );
  }

  @Patch('/send-for-validation')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  sendForValidation(@GetUser() user: User): Promise<void> {
    return this.scholarsService.sendForValidation(user);
  }

  @Patch('/:id/in-validation')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  inValidation(@Param('id') id: number): Promise<void> {
    return this.scholarsService.inValidation(+id);
  }

  @Patch('/:id/reprove')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  reprove(
    @Param('id') id: number,
    @Body() reproveScholarDto: ReproveScholarDto,
    @GetUser() user: User,
  ): Promise<void> {
    return this.scholarsService.reprove(+id, reproveScholarDto, user);
  }

  @Patch('/:id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  approve(
    @Param('id') id: number,
    @Body() approveScholarDto: ApproveScholarDto,
    @GetUser() user: User,
  ): Promise<void> {
    return this.scholarsService.approve(+id, approveScholarDto, user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'copyRgFrontAndVerse', maxCount: 1 },
        { name: 'copyCpfFrontAndVerse', maxCount: 1 },
        { name: 'curriculumVitae', maxCount: 1 },
        { name: 'copyHigherTitle', maxCount: 1 },
        { name: 'currentAccountCopy', maxCount: 1 },
        { name: 'proofOfAddress', maxCount: 1 },
        { name: 'medicalCertificate', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './public/file',
          filename: (req, file, cb) => {
            return cb(null, `${Date.now()}-${file.originalname}`);
          },
        }),
      },
    ),
  )
  update(
    @Param('id') id: string,
    @Body() updateScholarDto: UpdateCompletedScholarDto,
    @UploadedFiles()
    files: FilesScholar,
  ) {
    return this.scholarsService.update(+id, updateScholarDto, files);
  }

  @Get('/files/:file')
  seeUploadedAvatar(@Param('file') image: string, @Res() res) {
    return res.sendFile(image, { root: './public/file' });
  }
}
