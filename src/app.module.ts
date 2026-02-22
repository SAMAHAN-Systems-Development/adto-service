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
import { AssetsModule } from './assets/assets.module';
import { S3Module } from './s3/s3.module';
import { DashboardModule } from './dashboard/dashboard.module';

import { RegistrationsModule } from './registrations/registrations.module';
import { TicketRequestsModule } from './ticket-requests/ticket-requests.module';

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
    RegistrationsModule,
    TicketRequestsModule,
    AssetsModule,
    S3Module,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
