import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { OrganizationParentsModule } from './organization-parents/organization-parents.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PaymentsModule } from './payments/payments.module';
import { UsersModule } from './users/users.module';
import { EventAnnouncementsModule } from './event-announcements/event-announcements.module';
import { EventTicketsModule } from './event-tickets/event-tickets.module';

@Module({
  imports: [
    AuthModule,
    EventsModule,
    OrganizationParentsModule,
    OrganizationsModule,
    PaymentsModule,
    UsersModule,
    EventAnnouncementsModule,
    EventTicketsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
