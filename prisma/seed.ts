import { PrismaClient, UserType, AnnouncementType, EventRequestStatus, TicketRequestStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- Clear existing data ---
  await prisma.eventRequest.deleteMany(); // Clear new EventRequests model
  await prisma.ticketRequests.deleteMany();
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
    { id: 'parent_samahan', name: 'SAMAHAN', description: 'Central Student Government' },
    { id: 'parent_cs', name: 'Computer Studies', description: 'CS Cluster' },
    { id: 'parent_bm', name: 'Business & Management', description: 'BM Cluster' },
    { id: 'parent_sea', name: 'Engineering & Architecture', description: 'SEA Cluster' },
    { id: 'parent_son', name: 'Nursing', description: 'School of Nursing' },
    { id: 'parent_acc', name: 'Accountancy', description: 'Accountancy Cluster' },
    { id: 'parent_sas', name: 'Arts & Sciences', description: 'School of Arts and Sciences' },
  ];

  await prisma.organizationParent.createMany({ data: orgParentsData });
  console.log(`Created ${orgParentsData.length} organization parents.`);

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  // --- Define Organizations to Create (AdDU Based) ---
  const organizationsList = [
    { parentId: 'parent_samahan', acronym: 'SCB', name: 'SAMAHAN Central Board', description: 'The highest governing body.', email: 'samahan@addu.edu.ph', facebook: 'https://facebook.com/samahanaddu' },
    { parentId: 'parent_samahan', acronym: 'SSD', name: 'Samahan Systems Development', description: 'The technological arm.', email: 'ssd@addu.edu.ph', facebook: 'https://facebook.com/ssd.addu' },
    { parentId: 'parent_samahan', acronym: 'SCT', name: 'Samahan Creative Team', description: 'The creative design arm.', email: 'sct@addu.edu.ph', facebook: 'https://facebook.com/sct.addu' },
    
    { parentId: 'parent_cs', acronym: 'CSSEC', name: 'Computer Studies Student Executive Council', description: 'Governing body of the Computer Studies cluster.', email: 'cssec@addu.edu.ph' },
    { parentId: 'parent_cs', acronym: 'GDSC', name: 'Google Developer Student Clubs', description: 'University chapter of GDSC.', email: 'gdsc@addu.edu.ph' },

    { parentId: 'parent_bm', acronym: 'BMSEC', name: 'Business & Management Student Executive Council', description: 'Governing body of BM.', email: 'bmsec@addu.edu.ph' },
    { parentId: 'parent_bm', acronym: 'ASMS', name: 'Ateneo Society of Management Students', description: 'Organization for management students.', email: 'asms@addu.edu.ph' },

    { parentId: 'parent_sea', acronym: 'SEASEC', name: 'SEA Student Executive Council', description: 'Governing body of SEA.', email: 'seasec@addu.edu.ph' },
    { parentId: 'parent_sea', acronym: 'ACES', name: 'Association of Civil Engineering Students', description: 'Organization for civil engineering students.', email: 'aces@addu.edu.ph' },
    { parentId: 'parent_sea', acronym: 'AECES', name: 'Ateneo Electronics and Computer Engineering Society', description: 'Organization for ECE and CoE students.', email: 'aeces@addu.edu.ph' },

    { parentId: 'parent_son', acronym: 'SONSEC', name: 'School of Nursing Student Executive Council', description: 'Governing body of the School of Nursing.', email: 'sonsec@addu.edu.ph' },

    { parentId: 'parent_acc', acronym: 'JPIA', name: 'Junior Philippine Institute of Accountants', description: 'Organization for accountancy students.', email: 'jpia@addu.edu.ph' },

    { parentId: 'parent_sas', acronym: 'SSSEC', name: 'Social Sciences Student Executive Council', description: 'Representing the Social Sciences cluster.', email: 'sssec@addu.edu.ph' },
    { parentId: 'parent_sas', acronym: 'NSMSEC', name: 'Natural Sciences and Mathematics Cluster', description: 'Representing the Natural Sciences and Math cluster.', email: 'nsmsec@addu.edu.ph' },
    { parentId: 'parent_sas', acronym: 'HUMLETSEC', name: 'Humanities and Letters Cluster', description: 'Representing the Humanities and Letters cluster.', email: 'humletsec@addu.edu.ph' },
  ];

  const createdOrgIds: string[] = [];
  const now = new Date();

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
        organizationId: orgId,
        createdAt: now,
        updatedAt: now,
      },
    });

    // 2. Create OrganizationChild
    await prisma.organizationChild.create({
      data: {
        id: orgId,
        name: org.name,
        acronym: org.acronym,
        description: org.description,
        facebook: org.facebook || null,
        userId: userId,
        isAdmin: false,
        createdAt: now,
        updatedAt: now,
      },
    });

    // 3. Create Group Link
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
    { id: 'user_admin', email: 'admin@addu.edu.ph', password: hashedPassword, userType: UserType.ADMIN, isActive: true, createdAt: now, updatedAt: now },
    { id: 'user_student_1', email: 'student1@addu.edu.ph', password: hashedPassword, userType: UserType.USER, isActive: true, createdAt: now, updatedAt: now },
    { id: 'user_student_2', email: 'student2@addu.edu.ph', password: hashedPassword, userType: UserType.USER, isActive: true, createdAt: now, updatedAt: now },
  ];
  await prisma.user.createMany({ data: extraUsersData });
  console.log(`Created ${extraUsersData.length} extra users.`);

  // --- Seed Events & Event Requests ---
  const eventsData: any[] = [];
  const eventRequestsData: any[] = [];
  
  // Hand-picked realistic event catalogs
  const orgEventCatalogs: Record<string, {name: string, desc: string}[]> = {
    SCB: [
      { name: 'Palarong Atenista 2026', desc: 'The annual inter-cluster sports festival of Ateneo de Davao.' },
      { name: 'SAMAHAN General Assembly', desc: 'Biannual assembly for all cluster representatives and students.' }
    ],
    SSD: [
      { name: 'Ignatian Hacks 2026', desc: 'A 24-hour hackathon to build solutions for social good.' },
      { name: 'UI/UX Design Workshop', desc: 'Learn the fundamentals of product design and user research.' },
      { name: 'SSD Tech Summit', desc: 'Annual gathering of tech enthusiasts with industry speakers.' }
    ],
    SCT: [
      { name: 'Creative Design Week', desc: 'Showcase of digital arts, multimedia, and graphic design.' },
      { name: 'Photography Workshop', desc: 'Mastering the basics of event photography and photojournalism.' }
    ],
    CSSEC: [
      { name: 'CS Days 2026', desc: 'A week-long celebration for CS, IT, and IS students.' },
      { name: 'Career Talk: Tech Industry', desc: 'Industry professionals share insights on navigating the tech landscape.' }
    ],
    GDSC: [
      { name: 'Google I/O Extended Davao', desc: 'Bringing the Magic of Google I/O to the local community.' },
      { name: 'Flutter Festival', desc: 'Community-led event series where developers learn Flutter.' }
    ],
    BMSEC: [
      { name: 'Business Case Competition', desc: 'Test your strategic thinking and analytical skills.' },
      { name: 'Leadership & Management Seminar', desc: 'Empowering future business leaders.' }
    ],
    ASMS: [
      { name: 'Marketing Week', desc: 'Seminars and activities focused on marketing trends.' },
      { name: 'Finance Forum', desc: 'Understanding investments, stocks, and financial literacy.' }
    ],
    SEASEC: [
      { name: 'SEA Week', desc: 'A grand celebration for Engineering and Architecture students.' },
      { name: 'Engineering Expo', desc: 'Exhibit of capstone projects and engineering innovations.' }
    ],
    ACES: [
      { name: 'Bridge Building Competition', desc: 'Test the structural integrity of your team\'s model bridge.' }
    ],
    AECES: [
      { name: 'Robotics Workshop', desc: 'Hands-on training in building and programming microcontrollers.' }
    ],
    SONSEC: [
      { name: 'Nursing Week', desc: 'Honoring our future Nightingale nurses through various activities.' },
      { name: 'Medical Mission Training', desc: 'Preparation for upcoming community outreach programs.' }
    ],
    JPIA: [
      { name: 'Accounting Quiz Bowl', desc: 'Intellectual competition on accounting theories and practice.' },
      { name: 'Taxation Seminar Update', desc: 'Learning the newest BIR regulations and updates.' }
    ],
    SSSEC: [
      { name: 'Social Sciences Forum', desc: 'Discourse on pressing societal issues and action plans.' },
      { name: 'Debate Cup', desc: 'Inter-program debate competition.' }
    ],
    NSMSEC: [
      { name: 'Science Fair', desc: 'Exhibit of experiments and discoveries from NSM students.' },
      { name: 'Math Olympiad', desc: 'A challenging mathematics competition for all Ateneans.' }
    ],
    HUMLETSEC: [
      { name: 'Literary Fest', desc: 'Spoken poetry, creative writing, and literary appreciation.' },
      { name: 'Film Screening', desc: 'Showing student-made short films and documentaries.' }
    ]
  };

  const getRandomDateOffset = (minDays: number, maxDays: number) => {
    const date = new Date();
    const daysOffset = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
    date.setDate(date.getDate() + daysOffset);
    return date;
  };

  const getBusinessHourDate = (date: Date, hour: number) => {
    const newDate = new Date(date);
    newDate.setHours(hour, 0, 0, 0);
    return newDate;
  };

  for (const orgId of createdOrgIds) {
    const acronym = orgId.split('_')[1].toUpperCase();
    const catalog = orgEventCatalogs[acronym] || [{name: `${acronym} General Assembly`, desc: 'Annual event.'}];
    
    // Each org will have their catalog seeded
    catalog.forEach((eventInfo, i) => {
      // Vary past, near future, far future
      let daysOffsetMin = -30;
      let daysOffsetMax = 90;
      if (i === 0) { daysOffsetMin = 5; daysOffsetMax = 15; } // Near future
      else if (i === 1) { daysOffsetMin = -60; daysOffsetMax = -5; } // Past
      else { daysOffsetMin = 30; daysOffsetMax = 120; } // Far future

      const randomBaseDate = getRandomDateOffset(daysOffsetMin, daysOffsetMax);
      
      // Typical schedules: Morning (8am-12pm) or Afternoon (1pm-5pm) or Wholeday (8am-5pm)
      const scheduleTypes = [
        { startHour: 8, endHour: 12 },
        { startHour: 13, endHour: 17 },
        { startHour: 8, endHour: 17 }
      ];
      const schedule = scheduleTypes[Math.floor(Math.random() * scheduleTypes.length)];
      
      const startDate = getBusinessHourDate(randomBaseDate, schedule.startHour);
      const endDate = getBusinessHourDate(randomBaseDate, schedule.endHour);

      const eventId = `event_${orgId}_${i + 1}`;
      
      // Determine Approval/Published Status
      // 1. APPROVED and PUBLISHED
      // 2. DENIED and NOT PUBLISHED
      // 3. PENDING and NOT PUBLISHED
      const statusRoll = Math.random();
      let isPublished = false;
      let reqStatus: EventRequestStatus = EventRequestStatus.PENDING;
      let remark: string | null = null;

      if (statusRoll < 0.6) {
        // 60% are Approved and Published
        isPublished = true;
        reqStatus = EventRequestStatus.APPROVED;
      } else if (statusRoll < 0.8) {
        // 20% Pending
        isPublished = false;
        reqStatus = EventRequestStatus.PENDING;
      } else {
        // 20% Denied
        isPublished = false;
        reqStatus = EventRequestStatus.DENIED;
        remark = "The concept paper needs revisions on the budget matrix section before approval.";
      }

      // Remove Placeholders to avoid Next.js Image source errors
      let banner = null;
      let thumbnail = null;

      eventsData.push({
        id: eventId,
        name: eventInfo.name,
        description: eventInfo.desc,
        banner: banner,
        thumbnail: thumbnail,
        dateStart: startDate,
        dateEnd: endDate,
        orgId: orgId,
        isPublished: isPublished,
        isRegistrationOpen: isPublished ? (Math.random() > 0.2) : false, // Registration open if published
        isRegistrationRequired: Math.random() > 0.1,
        isOpenToOutsiders: Math.random() > 0.5,
        conceptPaperUrl: (reqStatus !== EventRequestStatus.PENDING) ? 'https://example.com/mock-concept-paper.pdf' : null,
        createdAt: now,
        updatedAt: now,
      });

      // Create proper EventRequest connection for Concept Paper Approval Flow
      eventRequestsData.push({
        id: `req_${eventId}`,
        eventId: eventId,
        orgId: orgId,
        status: reqStatus,
        remark: remark,
        createdAt: new Date(now.getTime() - 86400000), // Created 1 day ago
        updatedAt: now,
      });
    });
  }

  await prisma.event.createMany({ data: eventsData });
  console.log(`Created ${eventsData.length} events.`);

  await prisma.eventRequest.createMany({ data: eventRequestsData });
  console.log(`Created ${eventRequestsData.length} event requests (Concept Papers).`);

  // --- Seed Ticket Categories ---
  const ticketCategoriesData: any[] = [];
  
  eventsData.forEach((event) => {
    // Determine ticket context based on event properties
    const tickets = [];
    const deadline = new Date(event.dateStart);
    deadline.setDate(deadline.getDate() - 2); // Deadline 2 days before event
    
    if (event.name.includes("Hackathon") || event.name.includes("Hacks")) {
      tickets.push({ name: 'Hacker Pass', price: 0.0, capacity: 50 });
      if (event.isOpenToOutsiders) tickets.push({ name: 'Observer Pass (Outsiders)', price: 150.0, capacity: 30 });
    } else if (event.name.includes("Assembly") || event.name.includes("Days")) {
      tickets.push({ name: 'AdDU Student Pass', price: 0.0, capacity: 500 });
      tickets.push({ name: 'VIP Pass', price: 500.0, capacity: 20 });
    } else if (event.name.includes("Seminar") || event.name.includes("Workshop")) {
       tickets.push({ name: 'Early Bird', price: 150.0, capacity: 30 });
       tickets.push({ name: 'Regular Registration', price: 250.0, capacity: 100 });
    } else {
       tickets.push({ name: 'General Admission', price: 100.0, capacity: 200 });
       tickets.push({ name: 'Free Admission (Members)', price: 0.0, capacity: 50 });
    }

    tickets.forEach((tmpl, idx) => {
      ticketCategoriesData.push({
        id: `ticket_${event.id}_${idx}`,
        name: tmpl.name,
        description: `Access pass for ${tmpl.name}`,
        price: tmpl.price,
        capacity: tmpl.capacity,
        registrationDeadline: deadline,
        eventId: event.id,
        createdAt: now,
        updatedAt: now,
      });
    });
  });

  await prisma.ticketCategory.createMany({ data: ticketCategoriesData });
  console.log(`Created ${ticketCategoriesData.length} ticket categories.`);

  // --- Seed Ticket Requests ---
  const ticketRequestsData: any[] = [];
  
  ticketCategoriesData.forEach((ticket) => {
    // Randomly generate ticket requests for some tickets
    if (Math.random() > 0.6) {
      // Pick a random requesting organization
      const reqOrgId = createdOrgIds[Math.floor(Math.random() * createdOrgIds.length)];
      
      const statusRoll = Math.random();
      let status: TicketRequestStatus = TicketRequestStatus.PENDING;
      let ticketLink: string | null = null;
      let declineReason: string | null = null;

      if (statusRoll < 0.4) {
        status = TicketRequestStatus.APPROVED;
        ticketLink = `https://my-ticket-portal.example.com/bulk_${ticket.id}_${reqOrgId}`;
      } else if (statusRoll < 0.6) {
        status = TicketRequestStatus.DECLINED;
        declineReason = 'Not enough capacity for bulk requests. Please contact the organizers directly.';
      }

      ticketRequestsData.push({
        id: `treq_${ticket.id}_${reqOrgId}`,
        ticketId: ticket.id,
        orgId: reqOrgId,
        status: status,
        ticketLink: ticketLink,
        declineReason: declineReason,
        createdAt: now,
        updatedAt: now,
      });
    }
  });

  await prisma.ticketRequests.createMany({ data: ticketRequestsData });
  console.log(`Created ${ticketRequestsData.length} ticket requests.`);

  // --- Seed Registrations ---
  const registrationsData: any[] = [];
  const studentProfiles = [
    { name: 'Alex Santos', course: 'BS CS', cluster: 'Computer Studies', year: '3' },
    { name: 'Bea Garcia', course: 'BS Accountancy', cluster: 'Accountancy', year: '2' },
    { name: 'Charlie Cruz', course: 'BS Nursing', cluster: 'Nursing', year: '4' },
    { name: 'Dana Reyes', course: 'AB Psych', cluster: 'Arts & Sciences', year: '1' },
    { name: 'Evan Lim', course: 'BS ECE', cluster: 'Engineering & Architecture', year: '5' },
    { name: 'Fiona Tan', course: 'BS Business Management', cluster: 'Business & Management', year: '3' },
  ];

  ticketCategoriesData.forEach((ticket) => {
    // Only register if event is "published" and "registration required"
    const event = eventsData.find(e => e.id === ticket.eventId);
    if (!event.isPublished || !event.isRegistrationRequired) return;

    // Simulate sold-out for some small capacity tickets, otherwise random
    let count = Math.floor(Math.random() * 8);
    if (ticket.capacity <= 30 && Math.random() > 0.8) {
      count = ticket.capacity; // Sold out!
    }

    // Limit count to available profiles
    count = Math.min(count, studentProfiles.length);

    for (let k = 0; k < count; k++) {
      const profile = studentProfiles[k];
      const regId = `reg_${ticket.id}_${k}`;
      const email = `${profile.name.toLowerCase().replace(' ', '')}@addu.edu.ph`;

      registrationsData.push({
        id: regId,
        fullName: profile.name,
        email: email,
        yearLevel: profile.year,
        course: profile.course,
        cluster: profile.cluster,
        ticketCategoryId: ticket.id,
        confirmedAt: (ticket.price === 0 || Math.random() > 0.3) ? new Date() : null, // Free usually confirmed instantly
        isAttended: event.dateStart < new Date() ? (Math.random() > 0.2) : false, // Attended only if past event
        createdAt: now,
        updatedAt: now,
      });
    }
  });

  await prisma.registration.createMany({ data: registrationsData });
  console.log(`Created ${registrationsData.length} registrations.`);

  // --- Seed Event Announcements ---
  const announcementsData: any[] = [];
  eventsData.forEach((event) => {
    if (!event.isPublished) return;

    const annRoll = Math.random();
    if (annRoll > 0.6) {
      // 40% chance of announcement
      const annType = Math.random() > 0.3 ? AnnouncementType.INFO : AnnouncementType.WARNING;
      let title = '';
      let content = '';

      if (annType === AnnouncementType.INFO) {
        title = 'Event Reminder';
        content = `Please be reminded to bring your valid AdDU ID for verification upon entry. See you at ${event.name}!`;
      } else {
        title = 'Venue Modification';
        content = `Due to urgent reasons, the venue for ${event.name} has been moved to the Finster Auditorium.`;
      }

      announcementsData.push({
        eventId: event.id,
        title: title,
        content: content,
        announcementType: annType,
        createdAt: now,
        updatedAt: now,
      });
    }
  });

  await prisma.eventAnnouncements.createMany({ data: announcementsData });
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
