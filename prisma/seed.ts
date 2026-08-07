import { PrismaClient, Role, Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import * as path from 'node:path';
import * as fs from 'node:fs';

const prisma = new PrismaClient();

interface LocalizedText {
  hy: string;
  en: string;
  ru: string;
}

interface LegacyQuestionOption {
  id: string;
  text: LocalizedText;
}

interface LegacyQuestion {
  id: string;
  imageUrl?: string;
  text: LocalizedText;
  options: LegacyQuestionOption[];
  correctOptionId: string;
  info?: LocalizedText;
}

interface LegacyTest {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  questionIds: string[];
}

function readSeedData<T>(fileName: string): T {
  const filePath = path.join(__dirname, 'seed-data', fileName);
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME ?? 'Admin';

  if (!email || !password) {
    console.warn('SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping admin bootstrap.');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user ${email} already exists — skipping.`);
    return;
  }

  const passwordHash = await argon2.hash(password);
  await prisma.user.create({
    data: { email, passwordHash, name, role: Role.ADMIN },
  });
  console.log(`Bootstrap admin created: ${email}`);
}

async function seedContent() {
  const questionCount = await prisma.question.count();
  if (questionCount > 0) {
    console.log('Questions already seeded — skipping content import.');
    return;
  }

  const legacyQuestions = readSeedData<LegacyQuestion[]>('questions.json');
  const legacyTests = readSeedData<LegacyTest[]>('tests.json');

  console.log(`Importing ${legacyQuestions.length} questions...`);

  const questionRows: Prisma.QuestionCreateManyInput[] = [];
  const optionRows: Prisma.QuestionOptionCreateManyInput[] = [];
  const correctOptionByQuestionId = new Map<string, string>();

  for (const q of legacyQuestions) {
    questionRows.push({
      id: q.id,
      imageUrl: q.imageUrl,
      text: q.text as unknown as Prisma.InputJsonValue,
      info: (q.info as unknown as Prisma.InputJsonValue) ?? undefined,
      correctOptionId: '', // patched in the second pass below
    });

    let correctOptionNewId: string | undefined;
    for (const opt of q.options) {
      const newId = randomUUID();
      optionRows.push({
        id: newId,
        questionId: q.id,
        legacyId: opt.id,
        text: opt.text as unknown as Prisma.InputJsonValue,
      });
      if (opt.id === q.correctOptionId) {
        correctOptionNewId = newId;
      }
    }

    if (!correctOptionNewId) {
      throw new Error(`Question ${q.id}: correctOptionId "${q.correctOptionId}" not found among its options`);
    }
    correctOptionByQuestionId.set(q.id, correctOptionNewId);
  }

  for (const batch of chunk(questionRows, 500)) {
    await prisma.question.createMany({ data: batch, skipDuplicates: true });
  }
  for (const batch of chunk(optionRows, 500)) {
    await prisma.questionOption.createMany({ data: batch, skipDuplicates: true });
  }

  console.log('Remapping correctOptionId references...');
  const updates = [...correctOptionByQuestionId.entries()].map(([id, correctOptionId]) =>
    prisma.question.update({ where: { id }, data: { correctOptionId } }),
  );
  for (const batch of chunk(updates, 200)) {
    await prisma.$transaction(batch);
  }

  console.log(`Importing ${legacyTests.length} tests...`);

  const testRows: Prisma.TestCreateManyInput[] = legacyTests.map((t, index) => ({
    id: t.id,
    title: t.title as unknown as Prisma.InputJsonValue,
    description: t.description as unknown as Prisma.InputJsonValue,
    order: index,
  }));
  for (const batch of chunk(testRows, 500)) {
    await prisma.test.createMany({ data: batch, skipDuplicates: true });
  }

  const testQuestionRows: Prisma.TestQuestionCreateManyInput[] = legacyTests.flatMap((t) =>
    t.questionIds.map((questionId, position) => ({ testId: t.id, questionId, position })),
  );
  for (const batch of chunk(testQuestionRows, 500)) {
    await prisma.testQuestion.createMany({ data: batch, skipDuplicates: true });
  }

  console.log('Content import complete.');
}

async function main() {
  await seedAdmin();
  await seedContent();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
