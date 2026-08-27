import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { BcryptModule } from './bcrypt/bcrypt.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { S3Module } from './s3/s3.module';
import { MailModule } from './mail/mail.module';
import { ConfigModule } from '@nestjs/config';
import { EventsModule } from './events/events.module';
import { EventUsersModule } from './event-users/event-users.module';
import { EventSponsorsModule } from './event-sponsors/event-sponsors.module';
import { EventRundownsModule } from './event-rundowns/event-rundowns.module';
import { EventSpeakersModule } from './event_speakers/event_speakers.module';
import { WorkshopsModule } from './workshops/workshops.module';
import { WorkshopBookingsModule } from './workshop_bookings/workshop_bookings.module';
import { EventContactsModule } from './event-contacts/event-contacts.module';
import { PublicApiModule } from './public-api/public-api.module';
import { TenantsModule } from './tenants/tenants.module';
import { TenantProductsModule } from './tenant-products/tenant-products.module';
import { TenantTransactionsModule } from './tenant-transactions/tenant-transactions.module';
import { AttendancesModule } from './attendances/attendances.module';
import { TenantCategoriesModule } from './tenant-categories/tenant-categories.module';
import { ReportsModule } from './reports/reports.module';
import { SouvenirsModule } from './souvenirs/souvenirs.module';
import { TicketsModule } from './tickets/tickets.module';
import { RegistrationFieldsModule } from './registration-fields/registration-fields.module';
import { QrCodesModule } from './qr-codes/qr-codes.module';
import { ContactMessagesModule } from './contact-messages/contact-messages.module';
import { CertificatesModule } from './certificates/certificates.module';
import { PaymentsModule } from './payments/payments.module';
import { IntegrationsModule } from './integrations/integrations.module';

@Module({
  imports: [
    PrismaModule,
    BcryptModule,
    AuthModule,
    UsersModule,
    S3Module,
    MailModule,
    ConfigModule.forRoot({ isGlobal: true }),
    EventsModule,
    EventUsersModule,
    EventSponsorsModule,
    EventRundownsModule,
    EventSpeakersModule,
    WorkshopsModule,
    WorkshopBookingsModule,
    EventContactsModule,
    PublicApiModule,
    TenantsModule,
    TenantProductsModule,
    TenantTransactionsModule,
    AttendancesModule,
    TenantCategoriesModule,
    ReportsModule,
    SouvenirsModule,
    TicketsModule,
    RegistrationFieldsModule,
    QrCodesModule,
    ContactMessagesModule,
    CertificatesModule,
    PaymentsModule,
    IntegrationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
