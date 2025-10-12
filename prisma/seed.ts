import { PrismaClient, UserType, AnnouncementType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- Clear existing data (optional, use with caution) ---
  // Order matters due to foreign key constraints
  await prisma.payment.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.ticketCategory.deleteMany();
  await prisma.eventAnnouncements.deleteMany();
  await prisma.event.deleteMany();
  await prisma.organizationGroup.deleteMany();
  await prisma.booker.deleteMany();
  await prisma.organizationChild.deleteMany();
  await prisma.user.deleteMany();
  await prisma.course.deleteMany();
  await prisma.organizationParent.deleteMany();
  console.log('Cleared existing data.');

  const coursesData = [
    { id: 'course_cs', name: 'Computer Science' },
    { id: 'course_is', name: 'Information Systems' },
    { id: 'course_it', name: 'Information Technology' },
  ];
  await prisma.course.createMany({
    data: coursesData,
  });
  console.log(`Created ${coursesData.length} courses.`);

  const orgParentsData = [
    {
      id: 'parent_samahan',
      name: 'SAMAHAN Central Board',
      description: 'Student Government',
    },
    {
      id: 'parent_cs',
      name: 'Computer Studies Cluster',
      description: 'Academic Cluster',
    },
    {
      id: 'parent_bm',
      name: 'Business & Management Cluster',
      description: 'Academic Cluster',
    },
    {
      id: 'parent_nursing',
      name: 'School of Nursing',
      description: 'Academic Cluster',
    },
    {
      id: 'parent_acc',
      name: 'Accountancy Cluster',
      description: 'Academic Cluster',
    },
    {
      id: 'parent_hl',
      name: 'Humanities & Letters Cluster',
      description: 'Academic Cluster',
    },
  ];
  await prisma.organizationParent.createMany({
    data: orgParentsData,
  });
  console.log(`Created ${orgParentsData.length} organization parents.`);

  // --- Seed Users ---
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  const usersData = [
    // Admin users (2)
    {
      id: 'user_admin_1',
      email: 'admin1@example.com',
      password: hashedPassword,
      userType: UserType.ADMIN,
      isActive: true,
    },
    {
      id: 'user_admin_2',
      email: 'admin2@example.com',
      password: hashedPassword,
      userType: UserType.ADMIN,
      isActive: true,
    },
    // Organization users (2)
    {
      id: 'user_org_a',
      email: 'org_a@example.com',
      password: hashedPassword,
      userType: UserType.ORGANIZATION,
      isActive: true,
    },
    {
      id: 'user_org_b',
      email: 'org_b@example.com',
      password: hashedPassword,
      userType: UserType.ORGANIZATION,
      isActive: true,
    },
    // Regular users (2) - with booker associations
    {
      id: 'user_student_1',
      email: 'student1@example.com',
      password: hashedPassword,
      userType: UserType.USER,
      isActive: true,
    },
    {
      id: 'user_student_2',
      email: 'student2@example.com',
      password: hashedPassword,
      userType: UserType.USER,
      isActive: true,
    },
  ];
  await prisma.user.createMany({
    data: usersData.map(({ id, email, password, userType, isActive }) => ({
      id,
      email,
      password,
      userType,
      isActive,
    })),
  });
  console.log(`Created ${usersData.length} users.`);

  // --- Seed Organization Children ---
  const orgChildrenData = [
    // Existing organizations
    {
      id: 'org_a',
      name: 'Organization A',
      acronym: 'OrgA',
      description: 'First organization',
      userId: 'user_org_a',
      isAdmin: false,
    },
    {
      id: 'org_b',
      name: 'Organization B',
      acronym: 'OrgB',
      description: 'Second organization',
      userId: 'user_org_b',
      isAdmin: false,
    },

    // Samahan Central Board Children
    {
      id: 'org_samahan_sysdev',
      name: 'Samahan Systems Development',
      acronym: 'SSD',
      description: 'Technical department of SAMAHAN',
      isAdmin: false,
    },
    {
      id: 'org_samahan_comms',
      name: 'Samahan Communications',
      acronym: 'COMMS',
      description: 'Communications department of SAMAHAN',
      isAdmin: false,
    },
    {
      id: 'org_samahan_sponsorships',
      name: 'Samahan Sponsorships',
      acronym: 'SPON',
      description: 'Sponsorships department of SAMAHAN',
      isAdmin: false,
    },
    {
      id: 'org_samahan_creative',
      name: 'Samahan Creative Team',
      acronym: 'SCT',
      description: 'Creative department of SAMAHAN',
      isAdmin: false,
    },

    // Computer Studies Cluster Children
    {
      id: 'org_cs_1',
      name: 'Computer Society',
      acronym: 'CS',
      description: 'The core computing society',
      isAdmin: false,
    },
    {
      id: 'org_cs_2',
      name: 'Association for Computing Machinery',
      acronym: 'ACM',
      description: 'ACM student chapter',
      isAdmin: false,
    },
    {
      id: 'org_cs_3',
      name: 'Developers Society',
      acronym: 'DevSoc',
      description: 'Community of student developers',
      isAdmin: false,
    },
    {
      id: 'org_cs_4',
      name: 'CyberSecurity Club',
      acronym: 'CSC',
      description: 'Focus on cybersecurity topics',
      isAdmin: false,
    },
    {
      id: 'org_cs_5',
      name: 'Data Science Society',
      acronym: 'DSS',
      description: 'For data science enthusiasts',
      isAdmin: false,
    },

    // Business & Management Cluster Children
    {
      id: 'org_bm_1',
      name: 'Business Management Society',
      acronym: 'BMS',
      description: 'Society for business management students',
      isAdmin: false,
    },
    {
      id: 'org_bm_2',
      name: 'Marketing Association',
      acronym: 'MA',
      description: 'Association for marketing students',
      isAdmin: false,
    },
    {
      id: 'org_bm_3',
      name: 'Entrepreneurs Club',
      acronym: 'EClub',
      description: 'For entrepreneurial students',
      isAdmin: false,
    },
    {
      id: 'org_bm_4',
      name: 'Finance Society',
      acronym: 'FinSoc',
      description: 'For finance students',
      isAdmin: false,
    },
    {
      id: 'org_bm_5',
      name: 'Human Resource Development',
      acronym: 'HRD',
      description: 'For HR management students',
      isAdmin: false,
    },

    // School of Nursing Children
    {
      id: 'org_nursing_1',
      name: 'Student Nurses Association',
      acronym: 'SNA',
      description: 'Primary nursing organization',
      isAdmin: false,
    },
    {
      id: 'org_nursing_2',
      name: 'Nursing Community Outreach',
      acronym: 'NCO',
      description: 'Community service organization',
      isAdmin: false,
    },
    {
      id: 'org_nursing_3',
      name: 'Health Education Society',
      acronym: 'HES',
      description: 'Focuses on health education',
      isAdmin: false,
    },
    {
      id: 'org_nursing_4',
      name: 'Clinical Practice Group',
      acronym: 'CPG',
      description: 'Clinical skills development',
      isAdmin: false,
    },
    {
      id: 'org_nursing_5',
      name: 'Global Health Initiative',
      acronym: 'GHI',
      description: 'Global health awareness',
      isAdmin: false,
    },

    // Accountancy Cluster Children
    {
      id: 'org_acc_1',
      name: 'Junior Philippine Institute of Accountants',
      acronym: 'JPIA',
      description: 'Primary accounting organization',
      isAdmin: false,
    },
    {
      id: 'org_acc_2',
      name: 'Taxation Society',
      acronym: 'TaxSoc',
      description: 'Focus on taxation studies',
      isAdmin: false,
    },
    {
      id: 'org_acc_3',
      name: 'Audit Circle',
      acronym: 'AC',
      description: 'For auditing enthusiasts',
      isAdmin: false,
    },
    {
      id: 'org_acc_4',
      name: 'Financial Reporting Standards Group',
      acronym: 'FRSG',
      description: 'Study of financial reporting standards',
      isAdmin: false,
    },
    {
      id: 'org_acc_5',
      name: 'Accounting Technology Society',
      acronym: 'ATS',
      description: 'Integration of technology in accounting',
      isAdmin: false,
    },

    // Humanities & Letters Cluster Children
    {
      id: 'org_hl_1',
      name: 'Literary Guild',
      acronym: 'LitGuild',
      description: 'For literature enthusiasts',
      isAdmin: false,
    },
    {
      id: 'org_hl_2',
      name: 'Debating Society',
      acronym: 'DebSoc',
      description: 'For debate and public speaking',
      isAdmin: false,
    },
    {
      id: 'org_hl_3',
      name: 'Philosophy Club',
      acronym: 'PhilClub',
      description: 'For philosophy discussions',
      isAdmin: false,
    },
    {
      id: 'org_hl_4',
      name: 'Creative Writing Circle',
      acronym: 'CWC',
      description: 'For creative writers',
      isAdmin: false,
    },
    {
      id: 'org_hl_5',
      name: 'Historical Society',
      acronym: 'HistSoc',
      description: 'For history enthusiasts',
      isAdmin: false,
    },
  ];
  await prisma.organizationChild.createMany({
    data: orgChildrenData,
  });
  console.log(`Created ${orgChildrenData.length} organization children.`);

  // --- Update Organization Users with organizationId ---
  console.log('Updating organization users with organizationId...');

  // Update users to connect them to their organizations
  await prisma.user.update({
    where: { id: 'user_org_a' },
    data: { organizationId: 'org_a' }
  });

  await prisma.user.update({
    where: { id: 'user_org_b' },
    data: { organizationId: 'org_b' }
  });

  console.log('Updated organization users with organizationId.');

  // --- Seed Organization Groups (Link Parents and Children) ---
  const orgGroupsData = [
    // Existing relationships
    { organizationParentId: 'parent_samahan', organizationChildId: 'org_a' },
    { organizationParentId: 'parent_cs', organizationChildId: 'org_a' },
    { organizationParentId: 'parent_cs', organizationChildId: 'org_b' },

    // Samahan Central Board relationships
    {
      organizationParentId: 'parent_samahan',
      organizationChildId: 'org_samahan_sysdev',
    },
    {
      organizationParentId: 'parent_samahan',
      organizationChildId: 'org_samahan_comms',
    },
    {
      organizationParentId: 'parent_samahan',
      organizationChildId: 'org_samahan_sponsorships',
    },
    {
      organizationParentId: 'parent_samahan',
      organizationChildId: 'org_samahan_creative',
    },

    // Computer Studies Cluster relationships
    { organizationParentId: 'parent_cs', organizationChildId: 'org_cs_1' },
    { organizationParentId: 'parent_cs', organizationChildId: 'org_cs_2' },
    { organizationParentId: 'parent_cs', organizationChildId: 'org_cs_3' },
    { organizationParentId: 'parent_cs', organizationChildId: 'org_cs_4' },
    { organizationParentId: 'parent_cs', organizationChildId: 'org_cs_5' },

    // Business & Management Cluster relationships
    { organizationParentId: 'parent_bm', organizationChildId: 'org_bm_1' },
    { organizationParentId: 'parent_bm', organizationChildId: 'org_bm_2' },
    { organizationParentId: 'parent_bm', organizationChildId: 'org_bm_3' },
    { organizationParentId: 'parent_bm', organizationChildId: 'org_bm_4' },
    { organizationParentId: 'parent_bm', organizationChildId: 'org_bm_5' },

    // School of Nursing relationships
    {
      organizationParentId: 'parent_nursing',
      organizationChildId: 'org_nursing_1',
    },
    {
      organizationParentId: 'parent_nursing',
      organizationChildId: 'org_nursing_2',
    },
    {
      organizationParentId: 'parent_nursing',
      organizationChildId: 'org_nursing_3',
    },
    {
      organizationParentId: 'parent_nursing',
      organizationChildId: 'org_nursing_4',
    },
    {
      organizationParentId: 'parent_nursing',
      organizationChildId: 'org_nursing_5',
    },

    // Accountancy Cluster relationships
    { organizationParentId: 'parent_acc', organizationChildId: 'org_acc_1' },
    { organizationParentId: 'parent_acc', organizationChildId: 'org_acc_2' },
    { organizationParentId: 'parent_acc', organizationChildId: 'org_acc_3' },
    { organizationParentId: 'parent_acc', organizationChildId: 'org_acc_4' },
    { organizationParentId: 'parent_acc', organizationChildId: 'org_acc_5' },

    // Humanities & Letters Cluster relationships
    { organizationParentId: 'parent_hl', organizationChildId: 'org_hl_1' },
    { organizationParentId: 'parent_hl', organizationChildId: 'org_hl_2' },
    { organizationParentId: 'parent_hl', organizationChildId: 'org_hl_3' },
    { organizationParentId: 'parent_hl', organizationChildId: 'org_hl_4' },
    { organizationParentId: 'parent_hl', organizationChildId: 'org_hl_5' },
  ];
  await prisma.organizationGroup.createMany({
    data: orgGroupsData,
  });
  console.log(`Created ${orgGroupsData.length} organization groups.`);

  // --- Seed Bookers ---
  const bookersData = [
    {
      id: 'booker_1',
      contactNumber: '1234567890',
      courseId: 'course_cs',
      isAlumni: false,
      batch: 2025,
      userId: 'user_student_1',
    },
    {
      id: 'booker_2',
      contactNumber: '0987654321',
      courseId: 'course_is',
      isAlumni: true,
      batch: 2020,
      userId: 'user_student_2',
    },
  ];
  await prisma.booker.createMany({
    data: bookersData,
  });
  console.log(`Created ${bookersData.length} bookers.`);

  // --- Seed Events ---
  // Generate 5 events for each organization
  const eventsData = [];

  // Helper function to generate a random future date
  const getRandomFutureDate = (startMonths = 1, endMonths = 12) => {
    const today = new Date();
    const randomMonths =
      Math.floor(Math.random() * (endMonths - startMonths + 1)) + startMonths;
    const futureDate = new Date(today);
    futureDate.setMonth(today.getMonth() + randomMonths);
    return futureDate;
  };

  // Event types for variety
  const eventTypes = [
    'Conference',
    'Workshop',
    'Seminar',
    'Meetup',
    'Hackathon',
    'Webinar',
    'Panel Discussion',
    'Training',
    'Competition',
    'Symposium',
    'Forum',
    'Social Gathering',
    'Networking Event',
    'Exhibition',
    'Awards Ceremony',
  ];

  // Event descriptions
  const eventDescriptions = [
    'Join us for an exciting event filled with learning opportunities.',
    'Connect with industry professionals and expand your network.',
    'Learn new skills and enhance your knowledge in this interactive session.',
    'Showcase your talents and compete with your peers.',
    'Engage in meaningful discussions about the latest trends and innovations.',
    'Celebrate achievements and recognize outstanding contributions.',
    'Explore new ideas and perspectives through collaborative activities.',
    'Gain practical experience and hands-on training from experts.',
    'Discover opportunities for personal and professional growth.',
    'Be part of a community-driven initiative to foster innovation and creativity.',
  ];

  // Get all organization children IDs from the data we created earlier
  const orgChildIds = orgChildrenData.map((org) => org.id);

  // Generate 5 events for each organization
  orgChildIds.forEach((orgId) => {
    for (let i = 0; i < 5; i++) {
      // Calculate event dates
      const startDate = getRandomFutureDate(1, 12);
      const endDate = new Date(startDate);
      endDate.setHours(
        startDate.getHours() + Math.floor(Math.random() * 8) + 2,
      ); // Event duration: 2-10 hours

      // Randomly select if registration is open/required
      const isRegistrationOpen = Math.random() > 0.3;
      const isRegistrationRequired = Math.random() > 0.2;
      const isPublished = Math.random() > 0.3;
      const isOpenToOutsiders = Math.random() > 0.7;

      // Create event ID
      const eventId = `event_${orgId}_${i + 1}`;

      // Select random event type and description
      const eventType =
        eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const eventDescription =
        eventDescriptions[Math.floor(Math.random() * eventDescriptions.length)];

      // Create event
      eventsData.push({
        id: eventId,
        name: `${eventType} - ${orgId
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')}`,
        description: eventDescription,
        dateStart: startDate,
        dateEnd: endDate,
        orgId: orgId,
        isPublished: isPublished,
        isRegistrationOpen: isRegistrationOpen,
        isRegistrationRequired: isRegistrationRequired,
        isOpenToOutsiders: isOpenToOutsiders,
      });
    }
  });

  await prisma.event.createMany({
    data: eventsData,
  });
  console.log(`Created ${eventsData.length} events.`);

  // --- Seed Ticket Categories ---
  // Generate ticket categories for each event (1-3 categories per event)
  const ticketCategoriesData = [];

  // Ticket category templates
  const ticketCategoryTemplates = [
    {
      name: 'General Admission',
      description: 'Standard ticket for event access',
      price: 10.0,
      capacity: 100,
    },
    {
      name: 'VIP Access',
      description: 'Premium access with additional perks',
      price: 50.0,
      capacity: 20,
    },
    {
      name: 'Student Discount',
      description: 'Discounted rate for students with valid ID',
      price: 5.0,
      capacity: 50,
    },
    {
      name: 'Early Bird',
      description: 'Special discount for early registration',
      price: 7.0,
      capacity: 30,
    },
    {
      name: 'Free Entry',
      description: 'No-cost admission to the event',
      price: 0.0,
      capacity: 200,
    },
    {
      name: 'Group Pass',
      description: 'Discounted rate for groups of 5 or more',
      price: 8.0,
      capacity: 40,
    },
    {
      name: 'Premium Package',
      description: 'All-inclusive event experience with exclusive benefits',
      price: 75.0,
      capacity: 15,
    },
  ];

  // For each event, create 1-3 ticket categories
  eventsData.forEach((event) => {
    // Randomly determine how many ticket categories this event will have (1-3)
    const numCategories = Math.floor(Math.random() * 3) + 1;

    // Create a shuffled copy of templates to pick from
    const shuffledTemplates = [...ticketCategoryTemplates]
      .sort(() => 0.5 - Math.random())
      .slice(0, numCategories);

    // Create ticket categories for this event
    shuffledTemplates.forEach((template, index) => {
      // Set registration deadline to 1 day before event start
      const deadline = new Date(event.dateStart);
      deadline.setDate(deadline.getDate() - 1);

      ticketCategoriesData.push({
        id: `ticket_${event.id}_${index + 1}`,
        name: template.name,
        description: template.description,
        price: template.price,
        capacity: template.capacity,
        registrationDeadline: deadline,
        eventId: event.id,
      });
    });
  });

  await prisma.ticketCategory.createMany({
    data: ticketCategoriesData,
  });
  console.log(`Created ${ticketCategoriesData.length} ticket categories.`);

  // --- Seed Registrations ---
  const registrationsData = [];

  // We only have 2 bookers, so we'll create them first and then use them for each event
  const bookerIds = bookersData.map((booker) => booker.id);

  // For each event, create 5 registrations if possible (limited by our booker count)
  eventsData.forEach((event) => {
    // Get ticket categories for this event
    const eventTicketCategories = ticketCategoriesData.filter(
      (ticket) => ticket.eventId === event.id,
    );

    // Skip if no ticket categories for this event
    if (eventTicketCategories.length === 0) {
      return;
    }

    // Create registrations (up to 5 per event)
    const registrationsPerEvent = Math.min(
      5,
      bookerIds.length * eventTicketCategories.length,
    );

    for (let i = 0; i < registrationsPerEvent; i++) {
      // Cycle through available bookers and ticket categories
      const bookerId = bookerIds[i % bookerIds.length];
      const ticketCategory =
        eventTicketCategories[i % eventTicketCategories.length];

      // Create registration
      registrationsData.push({
        id: `reg_${event.id}_${i + 1}`,
        bookerId: bookerId,
        eventId: event.id,
        ticketCategoryId: ticketCategory.id,
        confirmedAt: Math.random() > 0.3 ? new Date() : null, // 70% confirmed
        isAttended: Math.random() > 0.5, // 50% attended
      });
    }
  });

  // If we have too many registrations, limit to a reasonable number
  const MAX_REGISTRATIONS = 1000;
  if (registrationsData.length > MAX_REGISTRATIONS) {
    registrationsData.splice(MAX_REGISTRATIONS);
  }

  await prisma.registration.createMany({
    data: registrationsData,
  });
  console.log(`Created ${registrationsData.length} registrations.`);

  // --- Seed Payments ---
  // Create payments for confirmed registrations with non-free tickets
  const paymentsData = [];

  // Process each registration
  registrationsData.forEach((registration) => {
    // Find the ticket category for this registration
    const ticketCategory = ticketCategoriesData.find(
      (ticket) => ticket.id === registration.ticketCategoryId,
    );

    // Only create payment if the ticket has a price > 0 and registration is confirmed
    if (
      ticketCategory &&
      ticketCategory.price > 0 &&
      registration.confirmedAt
    ) {
      paymentsData.push({
        id: `payment_${registration.id}`,
        amount: ticketCategory.price,
        currency: 'PHP',
        registrationId: registration.id,
      });
    }
  });

  await prisma.payment.createMany({
    data: paymentsData,
  });
  console.log(`Created ${paymentsData.length} payments.`);

  // --- Seed Event Announcements ---
  const eventAnnouncementsData = [];

  // Announcement templates
  const announcementTemplates = [
    {
      title: 'Important Event Update',
      content:
        'We would like to inform all attendees about important changes to the event schedule.',
      announcementType: AnnouncementType.INFO,
    },
    {
      title: 'Venue Change Notice',
      content:
        'Please be advised that the venue for this event has been changed. See details below.',
      announcementType: AnnouncementType.WARNING,
    },
    {
      title: 'Registration Deadline Extended',
      content:
        'Good news! We have extended the registration deadline for this event.',
      announcementType: AnnouncementType.INFO,
    },
    {
      title: 'Speaker Announcement',
      content: 'We are excited to announce our keynote speaker for this event.',
      announcementType: AnnouncementType.INFO,
    },
    {
      title: 'COVID-19 Safety Protocols',
      content: 'Please review our updated safety protocols for this event.',
      announcementType: AnnouncementType.WARNING,
    },
    {
      title: 'Event Cancellation',
      content:
        'We regret to inform you that this event has been cancelled due to unforeseen circumstances.',
      announcementType: AnnouncementType.CANCELLED,
    },
  ];

  // Create one announcement for each event
  eventsData.forEach((event) => {
    // Choose a random announcement template
    const template =
      announcementTemplates[
        Math.floor(Math.random() * announcementTemplates.length)
      ];

    // Don't use cancellation announcements for published events
    let chosenType = template.announcementType;
    if (event.isPublished && chosenType === AnnouncementType.CANCELLED) {
      chosenType = AnnouncementType.INFO;
    }

    eventAnnouncementsData.push({
      id: `announcement_${event.id}`,
      eventId: event.id,
      title: template.title,
      content: template.content,
      announcementType: chosenType,
    });
  });

  await prisma.eventAnnouncements.createMany({
    data: eventAnnouncementsData,
  });
  console.log(`Created ${eventAnnouncementsData.length} event announcements.`);

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
