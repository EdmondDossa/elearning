import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AUTH_COOKIE } from './auth/auth.constants';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('E-learning API')
    .setDescription(
      'Catalogue, apprentissage et administration. Pour tester les routes protégées, ' +
        'exécuter POST /api/auth/login depuis cette page : le navigateur conserve le cookie httpOnly. ' +
        'Aucun token à coller dans Authorize. POST /api/auth/logout révoque la session serveur. ' +
        'Les routes admin exigent un compte ADMIN.',
    )
    .setVersion('1.0')
    .addCookieAuth(AUTH_COOKIE)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: '/api/docs-json',
    swaggerOptions: { withCredentials: true, displayRequestDuration: true },
    customSiteTitle: 'E-learning — API',
  });
  return document;
}
