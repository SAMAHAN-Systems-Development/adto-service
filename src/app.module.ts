import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { FormAnswersModule } from './form-answers/form-answers.module';
import { FormQuestionsModule } from './form-questions/form-questions.module';
import { FormQuestionsChoicesModule } from './form-questions-choices/form-questions-choices.module';
import { OrganizationParentsModule } from './organization-parents/organization-parents.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PaymentsModule } from './payments/payments.module';
import { UsersModule } from './users/users.module';
import { EventAnnouncementsModule } from './event-announcements/event-announcements.module';

@Module({
  imports: [
    AuthModule,
    EventsModule,
    FormAnswersModule,
    FormQuestionsModule,
    FormQuestionsChoicesModule,
    OrganizationParentsModule,
    OrganizationsModule,
    PaymentsModule,
    UsersModule,
    EventAnnouncementsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
