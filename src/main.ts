import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { API_PREFIX, API_VERSION } from './common/constants/routers.constant';
import {
  MEMBER_ID_HEADER,
  ORGANIZATION_ID_HEADER,
  ORGANIZATION_SLUG_HEADER,
  REQUEST_ID_HEADER,
} from './common/constants/request-context.constant';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RequestContextInterceptor } from './common/interceptors/request-context.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AccessLogMiddleware } from './common/middleware/access-log.middleware';
import { API_DOCS_PATH, APP_NAME, getAppConfig } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const appConfig = getAppConfig();

  app.use(cookieParser());
  const accessLogMiddleware = new AccessLogMiddleware();
  app.use(accessLogMiddleware.use.bind(accessLogMiddleware));

  app.use(helmet());

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: API_VERSION,
    prefix: API_PREFIX,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors({
    origin: appConfig.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      REQUEST_ID_HEADER,
      ORGANIZATION_ID_HEADER,
      ORGANIZATION_SLUG_HEADER,
      MEMBER_ID_HEADER,
    ],
    exposedHeaders: [REQUEST_ID_HEADER],
  });

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new RequestContextInterceptor(),
    new TransformInterceptor(),
  );

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle(APP_NAME)
      .setDescription('Agoge Academy backend API documentation')
      .setVersion(process.env.npm_package_version ?? '0.1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(API_DOCS_PATH, app, document);
    console.log(
      `Swagger documentation available at: http://localhost:${appConfig.port}/${API_DOCS_PATH}`,
    );
  }

  await app.listen(appConfig.port);
  console.log(`Application is running on: http://localhost:${appConfig.port}`);
}
void bootstrap();
