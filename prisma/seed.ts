import { PrismaClient, UserType, FormElements } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- Clear existing data (optional, use with caution) ---
  // Order matters due to foreign key constraints
  await prisma.formAnswers.deleteMany();
  await prisma.formQuestionChoices.deleteMany();
  await prisma.formQuestions.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.ticketCategory.deleteMany();
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
  ];
  await prisma.organizationParent.createMany({
    data: orgParentsData,
  });
  console.log(`Created ${orgParentsData.length} organization parents.`);

  // --- Seed Users ---
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  const usersData = [
    {
      id: 'user_admin',
      email: 'admin@example.com',
      password: hashedPassword,
      userType: UserType.ADMIN,
      isActive: true,
    },
    {
      id: 'user_org_a',
      email: 'org_a@example.com',
      password: hashedPassword,
      userType: UserType.ORGANIZATION,
      isActive: true,
    },
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
      isAdmin: false,
    },
  ];
  await prisma.organizationChild.createMany({
    data: orgChildrenData,
  });
  console.log(`Created ${orgChildrenData.length} organization children.`);

  // --- Seed Organization Groups (Link Parents and Children) ---
  const orgGroupsData = [
    { organizationParentId: 'parent_samahan', organizationChildId: 'org_a' },
    { organizationParentId: 'parent_cs', organizationChildId: 'org_a' },
    { organizationParentId: 'parent_cs', organizationChildId: 'org_b' },
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
  const eventsData = [
    {
      id: 'event_1',
      name: 'OrgA Welcome Event',
      description: 'Welcome event for new members',
      dateStart: new Date('2025-09-01T09:00:00Z'),
      dateEnd: new Date('2025-09-01T17:00:00Z'),
      orgId: 'org_a',
      isPublished: true,
      isRegistrationOpen: true,
    },
    {
      id: 'event_2',
      name: 'OrgB Tech Talk',
      description: 'Tech talk session',
      dateStart: new Date('2025-10-15T14:00:00Z'),
      dateEnd: new Date('2025-10-15T16:00:00Z'),
      orgId: 'org_b',
      isPublished: true,
      isRegistrationOpen: false,
      isRegistrationRequired: false,
    },
  ];
  await prisma.event.createMany({
    data: eventsData,
  });
  console.log(`Created ${eventsData.length} events.`);

  // --- Seed Ticket Categories ---
  const ticketCategoriesData = [
    {
      id: 'ticket_cat_1',
      name: 'General Admission',
      description: 'Standard ticket',
      price: 10.0,
      capacity: 100,
      registrationDeadline: new Date('2025-08-30T23:59:59Z'),
      eventId: 'event_1',
    },
    {
      id: 'ticket_cat_2',
      name: 'VIP',
      description: 'VIP ticket with perks',
      price: 50.0,
      capacity: 20,
      registrationDeadline: new Date('2025-08-30T23:59:59Z'),
      eventId: 'event_1',
    },
    {
      id: 'ticket_cat_3',
      name: 'Free Entry',
      description: 'Free ticket for Tech Talk',
      price: 0.0,
      capacity: 200,
      registrationDeadline: new Date('2025-10-14T23:59:59Z'),
      eventId: 'event_2',
    },
  ];
  await prisma.ticketCategory.createMany({
    data: ticketCategoriesData,
  });
  console.log(`Created ${ticketCategoriesData.length} ticket categories.`);

  // --- Seed Registrations ---
  const registrationsData = [
    {
      id: 'reg_1',
      bookerId: 'booker_1',
      eventId: 'event_1',
      ticketCategoryId: 'ticket_cat_1',
      confirmedAt: new Date(),
      isAttended: false,
    },
    {
      id: 'reg_2',
      bookerId: 'booker_2',
      eventId: 'event_1',
      ticketCategoryId: 'ticket_cat_2',
      isAttended: false,
    },
  ];
  await prisma.registration.createMany({
    data: registrationsData,
  });
  console.log(`Created ${registrationsData.length} registrations.`);

  // --- Seed Payments ---
  const paymentsData = [
    {
      id: 'payment_1',
      amount: 10.0,
      currency: 'PHP',
      registrationId: 'reg_1',
    },
    {
      // VIP payment
      id: 'payment_2',
      amount: 50.0,
      currency: 'PHP',
      registrationId: 'reg_2',
    },
  ];
  await prisma.payment.createMany({
    data: paymentsData,
  });
  console.log(`Created ${paymentsData.length} payments.`);

  // --- Seed Form Questions ---
  const formQuestionsData = [
    {
      id: 'fq_1',
      question: 'What is your T-shirt size?',
      eventId: 'event_1',
      formElement: FormElements.SELECT,
      formElementId: 'tshirt_size', // Example ID, adjust as needed
    },
    {
      id: 'fq_2',
      question: 'Dietary Restrictions?',
      eventId: 'event_1',
      formElement: FormElements.TEXTAREA,
      formElementId: 'dietary',
    },
  ];
  await prisma.formQuestions.createMany({
    data: formQuestionsData,
  });
  console.log(`Created ${formQuestionsData.length} form questions.`);

  // --- Seed Form Question Choices ---
  const formQuestionChoicesData = [
    { id: 'fqc_1', choice: 'Small', formQuestionId: 'fq_1' },
    { id: 'fqc_2', choice: 'Medium', formQuestionId: 'fq_1' },
    { id: 'fqc_3', choice: 'Large', formQuestionId: 'fq_1' },
    { id: 'fqc_4', choice: 'XL', formQuestionId: 'fq_1' },
  ];
  await prisma.formQuestionChoices.createMany({
    data: formQuestionChoicesData,
  });
  console.log(
    `Created ${formQuestionChoicesData.length} form question choices.`,
  );

  // --- Seed Form Answers ---
  const formAnswersData = [
    {
      id: 'fa_1',
      answer: 'Medium',
      formQuestionId: 'fq_1',
      registrationId: 'reg_1',
    },
    {
      id: 'fa_2',
      answer: 'None',
      formQuestionId: 'fq_2',
      registrationId: 'reg_1',
    },
    {
      id: 'fa_3',
      answer: 'Large',
      formQuestionId: 'fq_1',
      registrationId: 'reg_2',
    },
    {
      id: 'fa_4',
      answer: 'Vegetarian',
      formQuestionId: 'fq_2',
      registrationId: 'reg_2',
    },
  ];
  await prisma.formAnswers.createMany({
    data: formAnswersData,
  });
  console.log(`Created ${formAnswersData.length} form answers.`);

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
