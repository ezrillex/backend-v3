import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });
  // todo dont ship this lol
  app.enableCors({
    origin: 'http://localhost:5173', // frontend de SvelteKit
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // allow creds this is for better auth local dev
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  // todo test frontend up to what size does it compress images, i.e. do we need more capacity?
  // app.useBodyParser('application/json', {
  //   bodyLimit: 10_000_000,
  // });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
