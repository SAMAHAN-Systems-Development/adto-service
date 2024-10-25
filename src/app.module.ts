import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminsModule } from './admins/admins.module';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { FormAnswersModule } from './form-answers/form-answers.module';
import { FormQuestionsModule } from './form-questions/form-questions.module';
import { FormQuestionsChoicesModule } from './form-questions-choices/form-questions-choices.module';
import { OrganizationParentsModule } from './organization-parents/organization-parents.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PaymentsModule } from './payments/payments.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    AdminsModule,
    AuthModule,
    EventsModule,
    FormAnswersModule,
    FormQuestionsModule,
    FormQuestionsChoicesModule,
    OrganizationParentsModule,
    OrganizationsModule,
    PaymentsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
