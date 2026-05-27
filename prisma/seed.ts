import { config } from 'dotenv';
config({ path: '.env.dev' });
config({ path: '.env' });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'] });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const SALT_ROUNDS = 10;

async function hash(plain: string) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

// ─── Estudiantes del CSV Brightspace ─────────────────────────────────────────
const CSV_STUDENTS: { email: string; firstName: string; lastName: string }[] = [
  { email: 'almachado@uninorte.edu.co', firstName: 'LUIS', lastName: 'LOPEZ MACHADO' },
  { email: 'acoronellm@uninorte.edu.co', firstName: 'MIGUEL', lastName: 'MARQUEZ CORONELL' },
  { email: 'alejandrarua@uninorte.edu.co', firstName: 'ALEJANDRA', lastName: 'VALENCIA RUA' },
  { email: 'sibelir@uninorte.edu.co', firstName: 'Sibeli', lastName: 'Rodriguez Diaz' },
  { email: 'jmcarrasquilla@uninorte.edu.co', firstName: 'JUAN', lastName: 'CARRASQUILLA ESCOBAR' },
  { email: 'jsrincon@uninorte.edu.co', firstName: 'JUAN', lastName: 'MORALES RINCON' },
  { email: 'gmrey@uninorte.edu.co', firstName: 'MARIA', lastName: 'REY BARRIOS' },
  { email: 'hbbarreto@uninorte.edu.co', firstName: 'HERNANDO', lastName: 'BARRETO ARENAS' },
  { email: 'cvperez@uninorte.edu.co', firstName: 'VALERIE', lastName: 'PEREZ CONTRERAS' },
  { email: 'elviraf@uninorte.edu.co', firstName: 'ELVIRA', lastName: 'FLOREZ CARBONELL' },
  { email: 'mpreston@uninorte.edu.co', firstName: 'MARCUS', lastName: 'RAMBAL PRESTON' },
  { email: 'veronicaospina@uninorte.edu.co', firstName: 'VERONICA', lastName: 'OSPINA MONSALVE' },
  { email: 'matizs@uninorte.edu.co', firstName: 'SAMUEL', lastName: 'MATIZ GARCIA' },
  { email: 'vargasjesus@uninorte.edu.co', firstName: 'JESUS', lastName: 'GARCIA VARGAS' },
  { email: 'jsantosf@uninorte.edu.co', firstName: 'JUAN', lastName: 'SANTOS RODRIGUEZ' },
  { email: 'jdimitola@uninorte.edu.co', firstName: 'JORGE', lastName: 'IMITOLA RUEDA' },
  { email: 'llaureano@uninorte.edu.co', firstName: 'LAUREANO', lastName: 'LAFAURIE DEL VILLAR' },
  { email: 'moisesmolino@uninorte.edu.co', firstName: 'MOISES', lastName: 'VEGA MOLINO' },
  { email: 'jhoreinisa@uninorte.edu.co', firstName: 'JHOREINIS', lastName: 'ANAYA DIAZ' },
  { email: 'jlbarreneche@uninorte.edu.co', firstName: 'JORGE', lastName: 'SANCHEZ BARRENECHE' },
  { email: 'edmonterrosa@uninorte.edu.co', firstName: 'EMMANUEL', lastName: 'MONTERROSA DURAN' },
  { email: 'alexismg@uninorte.edu.co', firstName: 'ALEXIS', lastName: 'MORENO GUTIERREZ' },
  { email: 'alejandrofontalvo@uninorte.edu.co', firstName: 'ALEJANDRO', lastName: 'FONTALVO GOMEZ' },
  { email: 'ndiaze@uninorte.edu.co', firstName: 'NELSON', lastName: 'DIAZ PIZARRO' },
  { email: 'japovea@uninorte.edu.co', firstName: 'JUAN', lastName: 'POVEA FERNANDEZ' },
  { email: 'oskleiderbethv@uninorte.edu.co', firstName: 'OSKLEIDERBETH', lastName: 'VASQUEZ VASQUEZ' },
  { email: 'pjrestrepo@uninorte.edu.co', firstName: 'JUAN', lastName: 'GUZMAN RESTREPO' },
  { email: 'tsandro@uninorte.edu.co', firstName: 'SANDRO', lastName: 'TORRES GUTIERREZ' },
  { email: 'mkeiver@uninorte.edu.co', firstName: 'KEIVER', lastName: 'MIRANDA LEMUS' },
  { email: 'ahuelvas@uninorte.edu.co', firstName: 'ANDRES', lastName: 'CHINCHILLA HUELVAS' },
  { email: 'vdcantillo@uninorte.edu.co', firstName: 'VICTOR', lastName: 'CANTILLO VALENCIA' },
  { email: 'sebastianotero@uninorte.edu.co', firstName: 'Sebastian', lastName: 'Monsalve Otero' },
  { email: 'arregocesf@uninorte.edu.co', firstName: 'Flavio', lastName: 'Arregoces Mercado' },
  { email: 'ordonezmc@uninorte.edu.co', firstName: 'MARIA', lastName: 'ORDOÑEZ PALENCIA' },
  { email: 'francocd@uninorte.edu.co', firstName: 'CRISTIAN', lastName: 'GONZALEZ FRANCO' },
  { email: 'jferrerm@uninorte.edu.co', firstName: 'JOSE', lastName: 'FERRER VIDAL' },
  { email: 'preslyr@uninorte.edu.co', firstName: 'PRESLY', lastName: 'ROMERO COLL' },
  { email: 'isabellapalencia@uninorte.edu.co', firstName: 'ISABELLA', lastName: 'MONTES PALENCIA' },
];

async function main() {
  console.log('🌱 Iniciando seed...');

  // ── 1. Admin ─────────────────────────────────────────────────────────────
  const adminEmail = 'admin@uninorte.edu.co';
  const adminPassword = await hash('Admin.2026!');
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      id: randomUUID(),
      email: adminEmail,
      password: adminPassword,
      fullName: 'Administrador SQLIA',
      role: 'ADMIN',
    },
  });
  console.log(`  ✓ Admin: ${admin.email}`);

  // ── 2. Profesores ────────────────────────────────────────────────────────
  const prof1Password = await hash('Profesor.2026!');
  const prof1 = await prisma.user.upsert({
    where: { email: 'cgonzalez@uninorte.edu.co' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'cgonzalez@uninorte.edu.co',
      password: prof1Password,
      fullName: 'Cristian González Franco',
      role: 'PROFESSOR',
    },
  });
  console.log(`  ✓ Profesor: ${prof1.email}`);

  const prof2Password = await hash('Profesor.2026!');
  const prof2 = await prisma.user.upsert({
    where: { email: 'jlopez@uninorte.edu.co' },
    update: {},
    create: {
      id: randomUUID(),
      email: 'jlopez@uninorte.edu.co',
      password: prof2Password,
      fullName: 'Jorge López Mendoza',
      role: 'PROFESSOR',
    },
  });
  console.log(`  ✓ Profesor: ${prof2.email}`);

  // ── 3. Estudiantes del CSV ───────────────────────────────────────────────
  const createdStudents: { id: string }[] = [];
  for (const s of CSV_STUDENTS) {
    const passwordHash = await hash(s.email);
    const student = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        id: randomUUID(),
        email: s.email,
        password: passwordHash,
        fullName: `${s.firstName} ${s.lastName}`,
        role: 'STUDENT',
      },
    });
    createdStudents.push({ id: student.id });
  }
  console.log(`  ✓ Estudiantes creados/existentes: ${createdStudents.length}`);

  // ── 4. Cursos ────────────────────────────────────────────────────────────
  const course1 = await prisma.course.upsert({
    where: { code: 'BD-2026-1A' },
    update: {},
    create: {
      id: randomUUID(),
      name: 'Bases de Datos I',
      code: 'BD-2026-1A',
      period: '2026-1',
      group: 'Grupo A',
      professorId: prof1.id,
    },
  });
  console.log(`  ✓ Curso: ${course1.name} (${course1.code})`);

  const course2 = await prisma.course.upsert({
    where: { code: 'BD-2026-1B' },
    update: {},
    create: {
      id: randomUUID(),
      name: 'Bases de Datos I',
      code: 'BD-2026-1B',
      period: '2026-1',
      group: 'Grupo B',
      professorId: prof2.id,
    },
  });
  console.log(`  ✓ Curso: ${course2.name} (${course2.code})`);

  // ── 5. Inscripciones: primeras 20 → curso1, resto → curso2 ───────────────
  const half = Math.ceil(createdStudents.length / 2);
  const group1 = createdStudents.slice(0, half);
  const group2 = createdStudents.slice(half);

  for (const s of group1) {
    await prisma.enrollment.upsert({
      where: { courseId_studentId: { courseId: course1.id, studentId: s.id } },
      update: {},
      create: { courseId: course1.id, studentId: s.id },
    });
  }
  for (const s of group2) {
    await prisma.enrollment.upsert({
      where: { courseId_studentId: { courseId: course2.id, studentId: s.id } },
      update: {},
      create: { courseId: course2.id, studentId: s.id },
    });
  }
  console.log(`  ✓ Inscripciones: ${group1.length} en ${course1.code}, ${group2.length} en ${course2.code}`);

  // ── 6. Evaluaciones (sin retos) ──────────────────────────────────────────
  const evaluationSeed = [
    {
      courseId: course1.id,
      createdBy: prof1.id,
      title: 'Parcial 1 — Consultas básicas SQL',
      description: 'Evaluación de consultas SELECT, WHERE y ORDER BY sobre tablas simples.',
      startDate: new Date('2026-06-02T08:00:00Z'),
      endDate: new Date('2026-06-02T10:00:00Z'),
      durationMinutes: 90,
      maxAttempts: 1,
    },
    {
      courseId: course1.id,
      createdBy: prof1.id,
      title: 'Parcial 2 — JOINs y subconsultas',
      description: 'Evaluación de INNER JOIN, LEFT JOIN y subconsultas correlacionadas.',
      startDate: new Date('2026-07-14T08:00:00Z'),
      endDate: new Date('2026-07-14T10:30:00Z'),
      durationMinutes: 120,
      maxAttempts: 1,
    },
    {
      courseId: course1.id,
      createdBy: prof1.id,
      title: 'Examen final — Optimización y transacciones',
      description: 'Examen integrador: índices, EXPLAIN, transacciones y control de concurrencia.',
      startDate: new Date('2026-08-11T08:00:00Z'),
      endDate: new Date('2026-08-11T11:00:00Z'),
      durationMinutes: 150,
      maxAttempts: 1,
    },
    {
      courseId: course2.id,
      createdBy: prof2.id,
      title: 'Taller evaluado — DML básico',
      description: 'INSERT, UPDATE y DELETE con condiciones sobre la base de datos de ejemplo.',
      startDate: new Date('2026-06-09T14:00:00Z'),
      endDate: new Date('2026-06-09T16:00:00Z'),
      durationMinutes: 90,
      maxAttempts: 2,
    },
    {
      courseId: course2.id,
      createdBy: prof2.id,
      title: 'Parcial — Agregaciones y agrupamiento',
      description: 'Evaluación de GROUP BY, HAVING, COUNT, SUM, AVG y funciones de ventana.',
      startDate: new Date('2026-07-21T14:00:00Z'),
      endDate: new Date('2026-07-21T16:30:00Z'),
      durationMinutes: 120,
      maxAttempts: 1,
    },
  ];

  for (const ev of evaluationSeed) {
    await prisma.evaluation.create({ data: { id: randomUUID(), ...ev } });
  }
  console.log(`  ✓ Evaluaciones creadas: ${evaluationSeed.length}`);

  console.log('\n✅ Seed completado.');
  console.log('\n  Credenciales:');
  console.log('  Admin       → admin@sqlia.edu          / Admin.2026!');
  console.log('  Profesor 1  → cgonzalez@uninorte.edu.co / Profesor.2026!');
  console.log('  Profesor 2  → jlopez@uninorte.edu.co    / Profesor.2026!');
  console.log('  Estudiantes → <email del CSV>            / <mismo email>');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
