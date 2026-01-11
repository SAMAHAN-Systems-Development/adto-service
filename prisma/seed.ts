import { PrismaClient, UserType, AnnouncementType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- Clear existing data ---
  await prisma.portalRequests.deleteMany(); // Added missing cleanup
  await prisma.registration.deleteMany();
  await prisma.ticketCategory.deleteMany();
  await prisma.eventAnnouncements.deleteMany();
  await prisma.event.deleteMany();
  await prisma.organizationGroup.deleteMany();
  await prisma.organizationChild.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organizationParent.deleteMany();
  console.log('Cleared existing data.');

  // --- Seed Organization Parents (Clusters) ---
  const orgParentsData = [
    {
      id: 'parent_samahan',
      name: 'SAMAHAN',
      description: 'Central Student Government',
    },
    {
      id: 'parent_cs',
      name: 'Computer Studies',
      description: 'CS Cluster',
    },
    {
      id: 'parent_bm',
      name: 'Business & Management',
      description: 'BM Cluster',
    },
    {
      id: 'parent_sea',
      name: 'Engineering & Architecture',
      description: 'SEA Cluster',
    },
    {
      id: 'parent_son',
      name: 'Nursing',
      description: 'School of Nursing',
    },
    {
      id: 'parent_acc',
      name: 'Accountancy',
      description: 'Accountancy Cluster',
    },
    {
      id: 'parent_sas',
      name: 'Arts & Sciences',
      description: 'School of Arts and Sciences',
    },
  ];

  await prisma.organizationParent.createMany({
    data: orgParentsData,
  });
  console.log(`Created ${orgParentsData.length} organization parents.`);

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  // --- Define Organizations to Create (AdDU Based) ---
  const organizationsList = [
    // SAMAHAN
    {
      parentId: 'parent_samahan',
      name: 'SAMAHAN Central Board',
      acronym: 'SCB',
      description: 'The highest governing body of the student government.',
      email: 'samahan@addu.edu.ph',
    },
    {
      parentId: 'parent_samahan',
      name: 'Samahan Systems Development',
      acronym: 'SSD',
      description: 'The technological arm of the SAMAHAN.',
      email: 'ssd@addu.edu.ph',
    },
    {
      parentId: 'parent_samahan',
      name: 'Samahan Creative Team',
      acronym: 'SCT',
      description: 'The creative design arm of the SAMAHAN.',
      email: 'sct@addu.edu.ph',
    },
    
    // CS
    {
      parentId: 'parent_cs',
      name: 'Computer Studies Student Executive Council',
      acronym: 'CSSEC',
      description: 'Governing body of the Computer Studies cluster.',
      email: 'cssec@addu.edu.ph',
    },
    {
      parentId: 'parent_cs',
      name: 'Google Developer Student Clubs',
      acronym: 'GDSC',
      description: 'University chapter of Google Developer Student Clubs.',
      email: 'gdsc@addu.edu.ph',
    },

    // BM
    {
      parentId: 'parent_bm',
      name: 'Business & Management Student Executive Council',
      acronym: 'BMSEC',
      description: 'Governing body of the Business & Management cluster.',
      email: 'bmsec@addu.edu.ph',
    },
    {
      parentId: 'parent_bm',
      name: 'Ateneo Society of Management Students',
      acronym: 'ASMS',
      description: 'Organization for management students.',
      email: 'asms@addu.edu.ph',
    },

    // SEA
    {
      parentId: 'parent_sea',
      name: 'SEA Student Executive Council',
      acronym: 'SEASEC',
      description: 'Governing body of the School of Engineering and Architecture.',
      email: 'seasec@addu.edu.ph',
    },
    {
      parentId: 'parent_sea',
      name: 'Association of Civil Engineering Students',
      acronym: 'ACES',
      description: 'Organization for civil engineering students.',
      email: 'aces@addu.edu.ph',
    },
    {
      parentId: 'parent_sea',
      name: 'Ateneo Electronics and Computer Engineering Society',
      acronym: 'AECES',
      description: 'Organization for ECE and CoE students.',
      email: 'aeces@addu.edu.ph',
    },

    // Nursing
    {
      parentId: 'parent_son',
      name: 'School of Nursing Student Executive Council',
      acronym: 'SONSEC',
      description: 'Governing body of the School of Nursing.',
      email: 'sonsec@addu.edu.ph',
    },

    // Accountancy
    {
      parentId: 'parent_acc',
      name: 'Junior Philippine Institute of Accountants',
      acronym: 'JPIA',
      description: 'Organization for accountancy students.',
      email: 'jpia@addu.edu.ph',
    },

    // Arts & Sciences
    {
      parentId: 'parent_sas',
      name: 'Social Sciences Student Executive Council',
      acronym: 'SSSEC',
      description: 'Representing the Social Sciences cluster.',
      email: 'sssec@addu.edu.ph',
    },
    {
      parentId: 'parent_sas',
      name: 'Natural Sciences and Mathematics Cluster',
      acronym: 'NSMSEC',
      description: 'Representing the Natural Sciences and Math cluster.',
      email: 'nsmsec@addu.edu.ph',
    },
    {
      parentId: 'parent_sas',
      name: 'Humanities and Letters Cluster',
      acronym: 'HUMLETSEC',
      description: 'Representing the Humanities and Letters cluster.',
      email: 'humletsec@addu.edu.ph',
    },
  ];

  const createdOrgIds: string[] = [];

  // --- Create Users & Organizations Loop ---
  console.log('Creating organizations and their users...');
  
  for (const org of organizationsList) {
    const orgId = `org_${org.acronym.toLowerCase()}`;
    const userId = `user_${org.acronym.toLowerCase()}`;

    // 1. Create User
    await prisma.user.create({
      data: {
        id: userId,
        email: org.email,
        password: hashedPassword,
        userType: UserType.ORGANIZATION,
        isActive: true,
        organizationId: orgId, // Redundant but kept for schema consistency
      },
    });

    // 2. Create OrganizationChild
    await prisma.organizationChild.create({
      data: {
        id: orgId,
        name: org.name,
        acronym: org.acronym,
        description: org.description,
        userId: userId, // Link to the user we just created
        isAdmin: false,
      },
    });

    // 3. Create Group Link (Parent-Child)
    await prisma.organizationGroup.create({
      data: {
        organizationParentId: org.parentId,
        organizationChildId: orgId,
      },
    });

    createdOrgIds.push(orgId);
  }

  console.log(`Created ${createdOrgIds.length} organizations with user accounts.`);

  // --- Seed Extra Users (Admins & Students) ---
  const extraUsersData = [
    // Admin
    {
      id: 'user_admin',
      email: 'admin@addu.edu.ph',
      password: hashedPassword,
      userType: UserType.ADMIN,
      isActive: true,
    },
    // Students
    {
      id: 'user_student_1',
      email: 'student1@addu.edu.ph',
      password: hashedPassword,
      userType: UserType.USER,
      isActive: true,
    },
    {
      id: 'user_student_2',
      email: 'student2@addu.edu.ph',
      password: hashedPassword,
      userType: UserType.USER,
      isActive: true,
    },
  ];

  await prisma.user.createMany({
    data: extraUsersData,
  });
  console.log(`Created ${extraUsersData.length} extra users.`);


  // --- Seed Events ---
  // Generate 3-5 events for each organization
  const eventsData: any[] = [];

  const getRandomFutureDate = (startMonths = 1, endMonths = 12) => {
    const today = new Date();
    const randomMonths =
      Math.floor(Math.random() * (endMonths - startMonths + 1)) + startMonths;
    const futureDate = new Date(today);
    futureDate.setMonth(today.getMonth() + randomMonths);
    return futureDate;
  };

  const eventTypes = [
    'Conference', 'Workshop', 'Seminar', 'General Assembly', 
    'Hackathon', 'Webinar', 'Forum', 'Social Gathering', 
    'Networking Event', 'Exhibition', 'Culminating Night'
  ];

  const eventDescriptions = [
    'Join us for an exciting event filled with learning opportunities.',
    'Connect with fellow students and expand your network.',
    'Learn new skills and enhance your knowledge sessions.',
    'The annual gathering of all members.',
    'Engage in meaningful discussions about relevant topics.',
    'Celebrate our achievements together.',
    'Explore new ideas and perspectives through collaborative activities.',
  ];

  createdOrgIds.forEach((orgId) => {
    // Generate 3 to 5 events
    const numEvents = Math.floor(Math.random() * 3) + 3;

    for (let i = 0; i < numEvents; i++) {
      const startDate = getRandomFutureDate(0, 6);
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + Math.floor(Math.random() * 8) + 2);

      const isRegistrationOpen = Math.random() > 0.3;
      const isRegistrationRequired = Math.random() > 0.1;
      const isPublished = Math.random() > 0.2;
      const isOpenToOutsiders = Math.random() > 0.8;

      const eventId = `event_${orgId}_${i + 1}`;
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      // Look up org acronym for the name
      const orgAcronym = orgId.split('_')[1].toUpperCase();

      eventsData.push({
        id: eventId,
        name: `${orgAcronym} ${eventType} ${2026}`,
        description: eventDescriptions[Math.floor(Math.random() * eventDescriptions.length)],
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
  const ticketCategoriesData: any[] = [];
  const ticketTemplates = [
    { name: 'General Admission', price: 50.0, capacity: 200 },
    { name: 'Member Discount', price: 30.0, capacity: 100 },
    { name: 'VIP', price: 150.0, capacity: 20 },
    { name: 'Free Admission', price: 0.0, capacity: 300 },
  ];

  eventsData.forEach((event) => {
    const numCategories = Math.floor(Math.random() * 2) + 1;
    const shuffled = [...ticketTemplates].sort(() => 0.5 - Math.random()).slice(0, numCategories);

    shuffled.forEach((tmpl, idx) => {
      const deadline = new Date(event.dateStart);
      deadline.setDate(deadline.getDate() - 1); // Deadline 1 day before

      ticketCategoriesData.push({
        id: `ticket_${event.id}_${idx}`,
        name: tmpl.name,
        description: 'Standard access',
        price: tmpl.price,
        capacity: tmpl.capacity,
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
  const registrationsData: any[] = [];
  
  const studentProfiles = [
    { name: 'Alex Santos', course: 'BS CS', cluster: 'Computer Studies', year: '3' },
    { name: 'Bea Garcia', course: 'BS Accountancy', cluster: 'Accountancy', year: '2' },
    { name: 'Charlie Cruz', course: 'BS Nursing', cluster: 'Nursing', year: '4' },
    { name: 'Dana Reyes', course: 'AB Psych', cluster: 'Arts & Sciences', year: '1' },
    { name: 'Evan Lim', course: 'BS ECE', cluster: 'Engineering & Architecture', year: '5' },
  ];

  ticketCategoriesData.forEach((ticket) => {
    // 0 to 4 registrations per ticket
    const count = Math.floor(Math.random() * 5);
    for(let k=0; k<count; k++) {
      const profile = studentProfiles[Math.floor(Math.random() * studentProfiles.length)];
      const regId = `reg_${ticket.id}_${k}`;
      const email = `${profile.name.toLowerCase().replace(' ','')}@addu.edu.ph`;
      
      registrationsData.push({
        id: regId,
        fullName: profile.name,
        email: email,
        yearLevel: profile.year,
        course: profile.course,
        cluster: profile.cluster,
        ticketCategoryId: ticket.id,
        confirmedAt: Math.random() > 0.5 ? new Date() : null,
        isAttended: false,
      });
    }
  });

  await prisma.registration.createMany({
    data: registrationsData,
  });
  console.log(`Created ${registrationsData.length} registrations.`);

  // --- Seed Event Announcements ---
  const announcementsData: any[] = [];
  const annTypes = [AnnouncementType.INFO, AnnouncementType.WARNING];
  
  eventsData.forEach((event) => {
    if(Math.random() > 0.6) { // Only some events have announcements
      announcementsData.push({
        eventId: event.id,
        title: 'Event Update',
        content: `Updates regarding ${event.name}`,
        announcementType: annTypes[Math.floor(Math.random() * annTypes.length)],
      });
    }
  });

  await prisma.eventAnnouncements.createMany({
    data: announcementsData,
  });
  console.log(`Created ${announcementsData.length} announcements.`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
