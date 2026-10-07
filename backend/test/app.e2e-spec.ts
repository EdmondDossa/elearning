import { App } from 'supertest/types';
import { OpenAPIObject } from '@nestjs/swagger';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';
import { randomUUID } from 'crypto';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { setupSwagger } from '../src/swagger';
import { JwtPayload } from '../src/auth/auth.types';

// Toujours utiliser une base de test dédiée, jamais la base de développement.
describe('Sessions révocables et documentation OpenAPI (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwt: JwtService;
  let cookie: string;
  let secondCookie: string;
  let userId: string;
  const courseIds: string[] = [];
  const catalogPrefix = `catalog-${randomUUID()}`;
  const email = `session-${randomUUID()}@example.com`;
  const password = 'TestSession123!';

  beforeAll(async () => {
    if (!process.env.E2E_DATABASE_URL) {
      throw new Error(
        'E2E_DATABASE_URL doit désigner une base de test migrée.',
      );
    }
    process.env.DATABASE_URL = process.env.E2E_DATABASE_URL;
    process.env.JWT_SECRET = 'isolated-e2e-test-secret-not-for-production';
    process.env.COOKIE_SECURE = 'false';
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    setupSwagger(app);
    await app.init();
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
  });

  afterAll(async () => {
    if (prisma)
      await prisma.course.deleteMany({ where: { id: { in: courseIds } } });
    if (prisma) await prisma.user.deleteMany({ where: { email } });
    if (app) await app.close();
  });

  it('expose la santé et refuse un accès sans session', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200, { status: 'ok' });
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('crée une session persistante à l’inscription', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, name: 'Test sessions', password })
      .expect(201);
    const user = response.body as { id: string; passwordHash?: string };
    userId = user.id;
    cookie = response.headers['set-cookie'][0].split(';')[0];
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(user.passwordHash).toBeUndefined();
    expect(await prisma.authSession.count({ where: { userId } })).toBe(1);
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', cookie)
      .expect(200);
  });

  it('crée une session distincte pour une seconde connexion', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    secondCookie = response.headers['set-cookie'][0].split(';')[0];
    expect(secondCookie).not.toBe(cookie);
    expect(await prisma.authSession.count({ where: { userId } })).toBe(2);
    await request(app.getHttpServer())
      .get('/api/admin/courses')
      .set('Cookie', secondCookie)
      .expect(403);
  });

  it('révoque le JWT copié après logout sans toucher à l’autre session', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', cookie)
      .expect(204);
    expect(response.headers['set-cookie'][0]).toContain('access_token=;');
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', cookie)
      .expect(401);
    await request(app.getHttpServer())
      .get('/api/dashboard')
      .set('Cookie', cookie)
      .expect(401);
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', secondCookie)
      .expect(200);
    expect(await prisma.authSession.count({ where: { userId } })).toBe(1);
  });

  it('autorise le logout répété, anonyme ou avec token invalide', async () => {
    for (const value of [cookie, 'access_token=invalid', '']) {
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', value)
        .expect(204);
    }
  });

  it('ignore une session révoquée sur une route publique', async () => {
    await request(app.getHttpServer())
      .get('/api/courses')
      .set('Cookie', cookie)
      .expect(200);
  });

  it('distingue inscription, lecture partielle et formation terminée dans le catalogue', async () => {
    for (const [index, title] of [
      'Découverte',
      'À commencer',
      'En cours',
      'Terminée',
      'Sans module',
    ].entries()) {
      const course = await prisma.course.create({
        data: {
          title: `${catalogPrefix} ${title}`,
          instructor: 'Test',
          language: 'fr',
          level: 'BEGINNER',
          description: 'Formation de test du catalogue',
          modules: {
            create:
              index === 4
                ? []
                : [1, 2].map((order) => ({
                    title: `Module ${order}`,
                    order,
                    durationSec: 20,
                    videoUrl: '/media/test.mp4',
                  })),
          },
          enrollments: { create: index > 0 ? [{ userId }] : [] },
        },
        include: { modules: true },
      });
      courseIds.push(course.id);
      if (index === 2 || index === 3) {
        await prisma.moduleProgress.createMany({
          data: course.modules.map((module) => ({
            userId,
            moduleId: module.id,
            positionSec: index === 2 ? 5 : 20,
            completed: index === 3,
          })),
        });
      }
    }
    const response = await request(app.getHttpServer())
      .get('/api/courses')
      .query({ search: catalogPrefix })
      .set('Cookie', secondCookie)
      .expect(200);
    const courses = response.body as {
      id: string;
      learning: {
        status: string;
        progress: number;
        completedModules: number;
      } | null;
    }[];
    expect(response.headers['cache-control']).toContain('no-store');
    expect(response.headers.vary).toContain('Cookie');
    expect(courses).toHaveLength(5);
    expect(courses.find((c) => c.id === courseIds[0])?.learning).toBeNull();
    expect(courses.find((c) => c.id === courseIds[1])?.learning).toEqual({
      status: 'NOT_STARTED',
      progress: 0,
      completedModules: 0,
    });
    expect(courses.find((c) => c.id === courseIds[2])?.learning).toEqual({
      status: 'IN_PROGRESS',
      progress: 0,
      completedModules: 0,
    });
    expect(courses.find((c) => c.id === courseIds[3])?.learning).toEqual({
      status: 'COMPLETED',
      progress: 100,
      completedModules: 2,
    });
    expect(courses.find((c) => c.id === courseIds[4])?.learning).toEqual({
      status: 'NOT_STARTED',
      progress: 0,
      completedModules: 0,
    });
  });

  it('ne divulgue pas la progression au visiteur ni à un autre utilisateur', async () => {
    const otherEmail = `other-${randomUUID()}@example.com`;
    try {
      const other = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: otherEmail, name: 'Autre apprenant', password })
        .expect(201);
      const otherCookie = other.headers['set-cookie'][0].split(';')[0];
      for (const value of ['', cookie, otherCookie]) {
        const response = await request(app.getHttpServer())
          .get('/api/courses')
          .query({ search: catalogPrefix })
          .set('Cookie', value)
          .expect(200);
        const courses = response.body as { learning: unknown }[];
        expect(courses).toHaveLength(5);
        expect(courses.every((c) => c.learning === null)).toBe(true);
      }
    } finally {
      await prisma.user.deleteMany({ where: { email: otherEmail } });
    }
  });

  it('actualise le statut et conserve les filtres du catalogue', async () => {
    const module = await prisma.module.findFirstOrThrow({
      where: { courseId: courseIds[2] },
    });
    await request(app.getHttpServer())
      .put(`/api/modules/${module.id}/progress`)
      .set('Cookie', secondCookie)
      .send({ completed: true })
      .expect(200);
    const response = await request(app.getHttpServer())
      .get('/api/courses')
      .query({ search: catalogPrefix, language: 'fr', level: 'BEGINNER' })
      .set('Cookie', secondCookie)
      .expect(200);
    const courses = response.body as {
      id: string;
      learning: { status: string; progress: number; completedModules: number };
    }[];
    expect(courses.find((c) => c.id === courseIds[2])?.learning).toEqual({
      status: 'IN_PROGRESS',
      progress: 50,
      completedModules: 1,
    });
    await request(app.getHttpServer())
      .get('/api/courses')
      .query({ search: catalogPrefix, language: 'en' })
      .set('Cookie', secondCookie)
      .expect(200, []);
  });

  it('refuse les anciens JWT sans identifiant de session et les signatures invalides', async () => {
    const legacy = await jwt.signAsync({ sub: userId, role: 'USER' });
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', `access_token=${legacy}`)
      .expect(401);
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', `${secondCookie}tampered`)
      .expect(401);
  });

  it('refuse une session appartenant à un autre utilisateur', async () => {
    const payload = jwt.decode<JwtPayload>(secondCookie.split('=')[1]);
    const token = await jwt.signAsync({
      sub: randomUUID(),
      sid: payload.sid,
      role: 'USER',
    });
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', `access_token=${token}`)
      .expect(401);
  });

  it('refuse un JWT expiré même si la session existe', async () => {
    const payload = jwt.decode<JwtPayload>(secondCookie.split('=')[1]);
    const token = await jwt.signAsync(
      { sub: payload.sub, sid: payload.sid, role: payload.role },
      { expiresIn: -1 },
    );
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', `access_token=${token}`)
      .expect(401);
  });

  it('refuse une session expirée même si le JWT est encore valide', async () => {
    await prisma.authSession.updateMany({
      where: { userId },
      data: { expiresAt: new Date(0) },
    });
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', secondCookie)
      .expect(401);
  });

  it('documente les DTO, routes publiques et authentification cookie', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);
    const body = response.body as OpenAPIObject;
    const schemas = body.components?.schemas as Record<string, SchemaObject>;
    expect(body.paths['/api/auth/login'].post?.security).toBeUndefined();
    expect(body.paths['/api/auth/me'].get?.security).toEqual([{ cookie: [] }]);
    expect(body.components?.securitySchemes?.cookie).toMatchObject({
      in: 'cookie',
      name: 'access_token',
    });
    expect(schemas.LoginDto.required).toEqual(
      expect.arrayContaining(['email', 'password']),
    );
    expect(schemas.CreateModuleDto.properties?.audioTracks).toMatchObject({
      items: { $ref: '#/components/schemas/AudioTrackDto' },
    });
    expect(schemas.UpdateCourseDto.required ?? []).toEqual([]);
    for (const name of ['search', 'language', 'level']) {
      expect(body.paths['/api/courses'].get?.parameters).toEqual(
        expect.arrayContaining([expect.objectContaining({ name })]),
      );
    }
    await request(app.getHttpServer())
      .get('/api/docs/')
      .expect(200)
      .expect(/swagger-ui/);
  });
});
