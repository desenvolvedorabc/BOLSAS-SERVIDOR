import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'body-parser';
import { AppModule } from './app.module';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';

const dir = './public/user/avatar/';

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '50mb' }));
  app.use(
    urlencoded({ limit: '50mb', extended: true, parameterLimit: 1000000 }),
  );

  app.setGlobalPrefix('v1');

  const options = new DocumentBuilder()
    .setTitle('PARC API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('v1/swagger', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors();

  const configService = app.get(ConfigService);

  const port = configService.get('PORT');

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
