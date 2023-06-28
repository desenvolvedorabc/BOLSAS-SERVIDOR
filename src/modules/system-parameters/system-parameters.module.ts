import { Module } from '@nestjs/common';
import { SystemParametersService } from './system-parameters.service';
import { SystemParametersController } from './system-parameters.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemParameter } from './entities/system-parameter.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SystemParameter])],
  controllers: [SystemParametersController],
  providers: [SystemParametersService],
  exports: [SystemParametersService],
})
export class SystemParametersModule {}
