import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  Put,
  Res,
} from '@nestjs/common';
import { MonthlyReportsService } from './monthly-reports.service';
import { CreateMonthlyReportDto } from './dto/create-monthly-report.dto';
import { UpdateMonthlyReportDto } from './dto/update-monthly-report.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { GetUser } from '../auth/decorator/current-user.decorator';
import { User } from '../user/model/entities/user.entity';
import { PaginationParamsMonthlyReports } from './dto/pagination-params-monthly-reports.dto';
import { ReproveMonthlyReport } from './dto/reprove-scholar.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Controller('monthly-reports')
@ApiTags('Relatórios Mensais')
export class MonthlyReportsController {
  constructor(private readonly monthlyReportsService: MonthlyReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/file',
        filename: (req, file, cb) => {
          return cb(null, `${Date.now()}-${file.originalname}`);
        },
      }),
    }),
  )
  create(
    @Body() createMonthlyReportDto: CreateMonthlyReportDto,
    @GetUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.monthlyReportsService.create(
      createMonthlyReportDto,
      user,
      file,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findAll(
    @Query() paginationParams: PaginationParamsMonthlyReports,
    @GetUser() user: User,
  ) {
    return this.monthlyReportsService.findAll(paginationParams, user);
  }

  @Get('general-search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  generalSearch(
    @Query() paginationParams: PaginationParamsMonthlyReports,
    @GetUser() user: User,
  ) {
    return this.monthlyReportsService.generalSearch(paginationParams, user);
  }

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findAllByScholar(
    @Query() paginationParams: PaginationParamsMonthlyReports,
    @GetUser() user: User,
  ) {
    return this.monthlyReportsService.findAllByScholar(paginationParams, user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.monthlyReportsService.findOne(+id);
  }

  @Patch('/:id/send-for-validation')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  sendForValidation(
    @Param('id') id: number,
    @GetUser() user: User,
  ): Promise<void> {
    return this.monthlyReportsService.sendForValidation(id, user);
  }

  @Patch('/:id/in-validation')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  inValidation(@Param('id') id: number, @GetUser() user: User): Promise<void> {
    return this.monthlyReportsService.inValidation(+id, user);
  }

  @Patch('/:id/reprove')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  reprove(
    @Param('id') id: number,
    @Body() reproveScholarDto: ReproveMonthlyReport,
    @GetUser() user: User,
  ): Promise<void> {
    return this.monthlyReportsService.reprove(+id, reproveScholarDto, user);
  }

  @Patch('/:id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  approve(@Param('id') id: number, @GetUser() user: User): Promise<void> {
    return this.monthlyReportsService.approve(+id, user);
  }

  @Patch('/:id/add-file')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/file',
        filename: (req, file, cb) => {
          return cb(null, `${Date.now()}-${file.originalname}`);
        },
      }),
    }),
  )
  addFile(
    @Param('id') id: number,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<void> {
    return this.monthlyReportsService.addFile(id, file);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/file',
        filename: (req, file, cb) => {
          return cb(null, `${Date.now()}-${file.originalname}`);
        },
      }),
    }),
  )
  update(
    @Param('id') id: string,
    @Body() updateMonthlyReportDto: UpdateMonthlyReportDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<void> {
    return this.monthlyReportsService.update(+id, updateMonthlyReportDto, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.monthlyReportsService.remove(+id, user);
  }

  @Get('/files/:file')
  seeUploadedAvatar(@Param('file') image: string, @Res() res) {
    return res.sendFile(image, { root: './public/file' });
  }
}
