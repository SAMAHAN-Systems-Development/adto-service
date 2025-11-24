import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';

@Injectable()
export class RegistrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRegistrationDto: CreateRegistrationDto) {
    const {
      fullName,
      schoolEmail,
      clusterId,
      yearLevel,
      eventId,
      ticketCategoryId,
    } = createRegistrationDto;

    // Verify event exists and is published
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (!event.isPublished) {
      throw new BadRequestException('Event is not published');
    }

    // Verify ticket category exists and belongs to the event
    const ticketCategory = await this.prisma.ticketCategory.findUnique({
      where: { id: ticketCategoryId },
    });

    if (!ticketCategory) {
      throw new NotFoundException('Ticket category not found');
    }

    if (ticketCategory.eventId !== eventId) {
      throw new BadRequestException('Ticket category does not belong to this event');
    }

    // Check if registration deadline has passed
    if (new Date() > ticketCategory.registrationDeadline) {
      throw new BadRequestException('Registration deadline has passed');
    }

    // Verify organization parent (cluster) exists
    const organizationParent = await this.prisma.organizationParent.findUnique({
      where: { id: clusterId },
    });

    if (!organizationParent) {
      throw new NotFoundException('Cluster not found');
    }

    // Check for duplicate registration by email for this event
    const existingRegistration = await this.prisma.registration.findFirst({
      where: {
        eventId,
        booker: {
          user: {
            email: schoolEmail,
          },
        },
      },
    });

    if (existingRegistration) {
      throw new BadRequestException('You have already registered for this event');
    }

    // Use default course (Computer Science) - can be made configurable later
    const defaultCourse = await this.prisma.course.findFirst({
      where: { id: 'course_cs' },
    });

    if (!defaultCourse) {
      throw new Error('Default course not found');
    }

    // Parse yearLevel to determine batch (approximate)
    const currentYear = new Date().getFullYear();
    let batch: number | null = null;
    let isAlumni = false;

    if (yearLevel === 'Graduate') {
      isAlumni = true;
      batch = currentYear - 1; // Rough estimate
    } else {
      // Extract year number (e.g., "1st Year" -> 1)
      const yearMatch = yearLevel.match(/(\d+)/);
      if (yearMatch) {
        const yearNumber = parseInt(yearMatch[1]);
        batch = currentYear + (4 - yearNumber); // Expected graduation year
      }
    }

    // Create user, booker, and registration in a transaction
    const result = await this.prisma.$transaction(async (prisma) => {
      // Create user
      const user = await prisma.user.create({
        data: {
          email: schoolEmail,
          password: '', // No password for public registrations
          userType: 'USER',
          isActive: true,
        },
      });

      // Create booker
      const booker = await prisma.booker.create({
        data: {
          contactNumber: '', // Not collected in this form
          courseId: defaultCourse.id,
          isAlumni,
          batch,
          userId: user.id,
        },
      });

      // Create registration
      const registration = await prisma.registration.create({
        data: {
          bookerId: booker.id,
          eventId,
          ticketCategoryId,
        },
        include: {
          event: true,
          ticketCategory: true,
          booker: {
            include: {
              user: true,
              course: true,
            },
          },
        },
      });

      return registration;
    });

    return {
      message: 'Registration successful',
      data: result,
    };
  }
}
