import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { ChallengesModule } from './challenges/challenges.module';
import { EvaluationChallengesModule } from './evaluation-challenges/evaluation-challenges.module';
import { SubmissionsModule } from './submissions/submission.module';
import { createBullRedisConnection } from './config/bull-redis.factory';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.dev', '.env'], }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: createBullRedisConnection(configService),
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    CoursesModule,
    EnrollmentsModule,
    EvaluationsModule,
    ChallengesModule,
    EvaluationChallengesModule,
    SubmissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
