// One-off seed script: adds companies, trainers, students, internships, real AI
// matches, applications, plans and weekly reports for a richer presentation demo.
// Run with: node scripts/seedPresentationDemo.js

import bcrypt from "bcrypt";
import db from "../config/database.js";
import User from "../models/User.js";
import Company from "../models/Company.js";
import Trainer from "../models/Trainer.js";
import Student from "../models/Student.js";
import Internship from "../models/Internship.js";
import Partnership from "../models/Partnership.js";
import CV from "../models/CV.js";
import InternshipMatch from "../models/InternshipMatch.js";
import InternshipPlan from "../models/InternshipPlan.js";
import WeeklyReport from "../models/WeeklyReport.js";
import FinalReport from "../models/FinalReport.js";
import aiMatchingService from "../services/aiMatchingService.js";

const PASSWORD = "Trainix@2026";
const TODAY = new Date();
const isoDate = (d) => d.toISOString().slice(0, 10);
const plusDays = (d, days) => new Date(d.getTime() + days * 86400000);

const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => (err ? reject(err) : resolve(result)));
  });

async function ensureUser(full_name, email, user_type) {
  const existing = await User.findByEmail(email);
  if (existing) return existing.id;
  const result = await User.create({ full_name, email, password: PASSWORD, user_type });
  return result.insertId;
}

// ---------------------------------------------------------------------------
// 1) Companies
// ---------------------------------------------------------------------------
const NEW_COMPANIES = [
  {
    key: "fintechps",
    name: "Fintech Palestine",
    email: "hr@fintechps.ps",
    phone: "+970-2-2345001",
    industry: "Financial Technology",
    address: "Ramallah, Palestine",
    description: "Fintech company building digital payment and banking infrastructure for the Palestinian market.",
    website: "https://fintechps.ps",
  },
  {
    key: "medtech",
    name: "MedTech Solutions",
    email: "careers@medtechps.com",
    phone: "+970-2-2345002",
    industry: "Health Technology",
    address: "Nablus, Palestine",
    description: "Healthcare technology company developing digital hospital and clinic management systems.",
    website: "https://medtechps.com",
  },
  {
    key: "cloudify",
    name: "Cloudify DevOps",
    email: "jobs@cloudifydevops.com",
    phone: "+970-2-2345003",
    industry: "Cloud & DevOps Consulting",
    address: "Ramallah, Palestine",
    description: "DevOps and cloud infrastructure consultancy helping startups scale on AWS and Azure.",
    website: "https://cloudifydevops.com",
  },
  {
    key: "pixelcraft",
    name: "PixelCraft Studio",
    email: "hr@pixelcraft.ps",
    phone: "+970-2-2345004",
    industry: "Mobile & Game Development",
    address: "Nablus, Palestine",
    description: "Mobile app and game development studio crafting cross-platform products with Flutter and Unity.",
    website: "https://pixelcraft.ps",
  },
];

// Existing companies we reuse (ids from current DB)
const EXISTING_COMPANY = { itg: 1, exalt: 2, foothill: 3, ghadeer: 4 };

// ---------------------------------------------------------------------------
// 2) Trainers (one new trainer per new company + one for Ghadeer, which had none)
// ---------------------------------------------------------------------------
const NEW_TRAINERS = [
  { full_name: "Nadia Kanaan", email: "nadia.trainer@fintechps.ps", companyKey: "fintechps", specialization: "Backend Development", experience_years: 5 },
  { full_name: "Suhail Barghouti", email: "suhail.trainer@medtechps.com", companyKey: "medtech", specialization: "Frontend Development", experience_years: 4 },
  { full_name: "Ziad Qutub", email: "ziad.trainer@cloudifydevops.com", companyKey: "cloudify", specialization: "DevOps & Cloud", experience_years: 6 },
  { full_name: "Maya Halaby", email: "maya.trainer@pixelcraft.ps", companyKey: "pixelcraft", specialization: "Mobile Development", experience_years: 4 },
  { full_name: "Widad Freij", email: "widad.trainer@ghadeer.com", companyId: EXISTING_COMPANY.ghadeer, specialization: "Business Systems & IT Support", experience_years: 7 },
];

// ---------------------------------------------------------------------------
// 3) Internships
// ---------------------------------------------------------------------------
const NEW_INTERNSHIPS = [
  { key: "it-mob", companyId: EXISTING_COMPANY.itg, title: "Mobile App Developer Intern", specialization: "Mobile Development",
    requirements: "Experience with Flutter or React Native, Android/iOS development, Git version control.",
    min_gpa: 2.80, work_mode: "on-site", capacity: 2 },
  { key: "ex-ai", companyId: EXISTING_COMPANY.exalt, title: "AI Research Intern", specialization: "Artificial Intelligence",
    requirements: "Strong Python skills, experience with TensorFlow or PyTorch, understanding of machine learning and data science fundamentals.",
    min_gpa: 3.20, work_mode: "remote", capacity: 2 },
  { key: "fh-qa", companyId: EXISTING_COMPANY.foothill, title: "QA Automation Intern", specialization: "Software Testing",
    requirements: "Knowledge of software testing methodologies, experience with Selenium or Cypress, familiarity with Jira and API testing (Postman).",
    min_gpa: 2.60, work_mode: "hybrid", capacity: 2 },
  { key: "gd-it", companyId: EXISTING_COMPANY.ghadeer, title: "IT Support & Systems Intern", specialization: "Business Administration",
    requirements: "Basic networking knowledge, Git, strong communication and problem-solving skills, familiarity with Agile/Scrum.",
    min_gpa: 2.50, work_mode: "on-site", capacity: 2 },
  { key: "ft-be", companyKey: "fintechps", title: "Backend Engineer Intern", specialization: "Backend Development",
    requirements: "Solid Node.js and Express experience, MySQL or PostgreSQL, REST API design, Git.",
    min_gpa: 3.00, work_mode: "hybrid", capacity: 2 },
  { key: "mt-fe", companyKey: "medtech", title: "Frontend Developer Intern", specialization: "Web Development",
    requirements: "HTML, CSS, JavaScript, React or Vue, responsive design, Git.",
    min_gpa: 2.70, work_mode: "remote", capacity: 3 },
  { key: "cf-devops", companyKey: "cloudify", title: "DevOps / Cloud Infrastructure Intern", specialization: "DevOps",
    requirements: "Docker, Kubernetes, AWS or Azure, CI/CD pipelines (Jenkins), Linux fundamentals.",
    min_gpa: 3.00, work_mode: "remote", capacity: 2 },
  { key: "cf-db", companyKey: "cloudify", title: "Database Engineer Intern", specialization: "Database Systems",
    requirements: "MySQL, PostgreSQL, MongoDB, SQL query optimization, Node.js or Python.",
    min_gpa: 2.80, work_mode: "on-site", capacity: 1 },
  { key: "pc-mobgame", companyKey: "pixelcraft", title: "Mobile Game Developer Intern", specialization: "Mobile Development",
    requirements: "Flutter, React Native, Android, mobile UI/UX, Git.",
    min_gpa: 2.50, work_mode: "on-site", capacity: 2 },
  { key: "pc-uiux", companyKey: "pixelcraft", title: "UI/UX & Frontend Intern", specialization: "Web Development",
    requirements: "HTML, CSS, JavaScript, Vue or React, Figma, Bootstrap, UI/UX design principles.",
    min_gpa: 2.50, work_mode: "hybrid", capacity: 2 },
];

// ---------------------------------------------------------------------------
// 4) Partnerships to make new internships visible to students (findByStudentUniversity)
// ---------------------------------------------------------------------------
const UNI = { najah: 1, birzeit: 2, ptuk: 3 };
const NEW_PARTNERSHIPS = [
  { universityId: UNI.najah, companyId: EXISTING_COMPANY.itg },
  { universityId: UNI.najah, companyId: EXISTING_COMPANY.foothill },
  { universityId: UNI.birzeit, companyId: EXISTING_COMPANY.exalt },
  { universityId: UNI.najah, companyKey: "fintechps" },
  { universityId: UNI.birzeit, companyKey: "fintechps" },
  { universityId: UNI.najah, companyKey: "medtech" },
  { universityId: UNI.birzeit, companyKey: "medtech" },
  { universityId: UNI.ptuk, companyKey: "cloudify" },
  { universityId: UNI.birzeit, companyKey: "cloudify" },
  { universityId: UNI.najah, companyKey: "pixelcraft" },
  { universityId: UNI.birzeit, companyKey: "pixelcraft" },
];

// ---------------------------------------------------------------------------
// 5) Students + CV skill profiles
// ---------------------------------------------------------------------------
const NEW_STUDENTS = [
  { key: "yazan", full_name: "Yazan Hammad", email: "yazan.hammad@stu.najah.edu", universityId: UNI.najah,
    major: "Computer Science", academic_year: "Year 3", gpa: 3.85, work_mode: "remote",
    skills: ["HTML", "CSS", "JavaScript", "React", "TypeScript", "Sass", "Git", "Figma"] },
  { key: "dana", full_name: "Dana Qassem", email: "dana.qassem@stu.najah.edu", universityId: UNI.najah,
    major: "Software Engineering", academic_year: "Year 4", gpa: 3.65, work_mode: "hybrid",
    skills: ["Node.js", "Express", "Java", "MySQL", "REST APIs", "Git", "Docker"] },
  { key: "rami", full_name: "Rami Fares", email: "rami.fares@stu.najah.edu", universityId: UNI.najah,
    major: "Computer Science", academic_year: "Year 3", gpa: 2.95, work_mode: "on-site",
    skills: ["Software Testing", "Selenium", "Cypress", "Test Cases", "Jira", "Postman", "SQL"] },
  { key: "farah", full_name: "Farah Sabbagh", email: "farah.sabbagh@stu.birzeit.edu", universityId: UNI.birzeit,
    major: "Computer Science", academic_year: "Year 4", gpa: 3.95, work_mode: "remote",
    skills: ["Python", "TensorFlow", "Machine Learning", "Data Science", "Pandas", "NumPy", "SQL"] },
  { key: "tariq", full_name: "Tariq Barakat", email: "tariq.barakat@stu.birzeit.edu", universityId: UNI.birzeit,
    major: "Information Technology", academic_year: "Year 3", gpa: 3.10, work_mode: "on-site",
    skills: ["MySQL", "PostgreSQL", "MongoDB", "Node.js", "Python", "Git"] },
  { key: "hala", full_name: "Hala Nassar", email: "hala.nassar@stu.birzeit.edu", universityId: UNI.birzeit,
    major: "Software Engineering", academic_year: "Year 4", gpa: 3.55, work_mode: "hybrid",
    skills: ["Flutter", "Dart", "React Native", "Android", "Firebase", "Git"] },
  { key: "karam", full_name: "Karam Odeh", email: "karam.odeh@stu.ptuk.edu.ps", universityId: UNI.ptuk,
    major: "Computer Engineering", academic_year: "Year 3", gpa: 3.20, work_mode: "remote",
    skills: ["Docker", "Kubernetes", "AWS", "CI/CD", "Jenkins", "Linux", "Python"] },
  { key: "rawan", full_name: "Rawan Titi", email: "rawan.titi@stu.ptuk.edu.ps", universityId: UNI.ptuk,
    major: "Network Engineering", academic_year: "Year 4", gpa: 2.80, work_mode: "on-site",
    skills: ["Git", "GitHub", "Agile", "Scrum", "Networking", "Linux", "Bash"] },
  { key: "bilal", full_name: "Bilal Shaheen", email: "bilal.shaheen@stu.ptuk.edu.ps", universityId: UNI.ptuk,
    major: "Computer Science", academic_year: "Year 2", gpa: 2.60, work_mode: "hybrid",
    skills: ["HTML", "CSS", "Git", "C++"] },
  { key: "sireen", full_name: "Sireen Amer", email: "sireen.amer@stu.najah.edu", universityId: UNI.najah,
    major: "Computer Science", academic_year: "Year 4", gpa: 3.40, work_mode: "remote",
    skills: ["HTML", "CSS", "JavaScript", "Vue", "Figma", "UI/UX Design", "Bootstrap"] },
];

// application plan: student key -> { internshipKey, outcome: accept|reject|pending|none }
const APPLICATION_PLAN = {
  yazan: { internshipKey: "mt-fe", outcome: "accept" },
  dana: { internshipKey: "ft-be", outcome: "accept" },
  rami: { internshipKey: "fh-qa", outcome: "pending" },
  farah: { internshipKey: "ex-ai", outcome: "accept", finalReport: true },
  tariq: { internshipKey: "cf-db", outcome: "pending" },
  hala: { internshipKey: "pc-mobgame", outcome: "accept" },
  karam: { internshipKey: "cf-devops", outcome: "accept" },
  rawan: { outcome: "none" },
  bilal: { internshipKey: "gd-it", outcome: "reject" },
  sireen: { internshipKey: "pc-uiux", outcome: "pending" },
};

async function main() {
  console.log("\n================ SEED: Presentation demo data ================\n");

  // ---- Companies ----
  const companyId = { ...EXISTING_COMPANY };
  for (const c of NEW_COMPANIES) {
    const existing = await Company.findByEmail(c.email);
    if (existing) {
      companyId[c.key] = existing.id;
      console.log(`= company exists: ${c.name} (id ${existing.id})`);
      continue;
    }
    const result = await Company.create({ ...c, status: "active" });
    companyId[c.key] = result.insertId;
    console.log(`+ company created: ${c.name} (id ${result.insertId})`);
  }

  // ---- Partnerships ----
  for (const p of NEW_PARTNERSHIPS) {
    const cId = p.companyId ?? companyId[p.companyKey];
    const existing = await Partnership.checkExists(p.universityId, cId);
    if (existing) {
      console.log(`= partnership exists: uni ${p.universityId} <-> company ${cId}`);
      continue;
    }
    await Partnership.create({
      university_id: p.universityId,
      company_id: cId,
      agreement_date: isoDate(TODAY),
      status: "active",
      training_hours: 240,
    });
    console.log(`+ partnership created: uni ${p.universityId} <-> company ${cId}`);
  }

  // ---- Trainers ----
  const trainerId = {};
  for (const t of NEW_TRAINERS) {
    const cId = t.companyId ?? companyId[t.companyKey];
    const userId = await ensureUser(t.full_name, t.email, "trainer");
    const existingTrainer = await Trainer.findByUserId(userId);
    if (existingTrainer) {
      trainerId[t.email] = existingTrainer.id;
      console.log(`= trainer exists: ${t.full_name} (id ${existingTrainer.id})`);
      continue;
    }
    const result = await Trainer.create({
      company_id: cId,
      user_id: userId,
      specialization: t.specialization,
      experience_years: t.experience_years,
      bio: `${t.specialization} trainer at ${cId === companyId.ghadeer ? "Ghadeer Business Management" : t.companyKey}.`,
      status: "active",
    });
    trainerId[t.email] = result.insertId;
    console.log(`+ trainer created: ${t.full_name} (id ${result.insertId})`);
  }
  // company -> trainer lookup (existing + new), first trainer per company wins
  const existingTrainerRows = await dbRun("SELECT id, company_id FROM trainers");
  const trainerByCompany = {};
  for (const row of existingTrainerRows) {
    if (!trainerByCompany[row.company_id]) trainerByCompany[row.company_id] = row.id;
  }

  // ---- Internships ----
  const internshipId = {};
  const existingInternshipRows = await dbRun(
    "SELECT id, company_id, title FROM internships WHERE title IN (?)",
    [NEW_INTERNSHIPS.map((i) => i.title)]
  );
  for (const i of NEW_INTERNSHIPS) {
    const cId = i.companyId ?? companyId[i.companyKey];
    const already = existingInternshipRows.find((r) => r.company_id === cId && r.title === i.title);
    if (already) {
      internshipId[i.key] = already.id;
      console.log(`= internship exists: ${i.title} (id ${already.id})`);
      continue;
    }
    const result = await Internship.create({
      company_id: cId,
      title: i.title,
      description: `${i.title} at company #${cId}. ${i.requirements}`,
      requirements: i.requirements,
      specialization: i.specialization,
      capacity: i.capacity,
      status: "open",
      min_gpa: i.min_gpa,
      work_mode: i.work_mode,
    });
    internshipId[i.key] = result.insertId;
    console.log(`+ internship created: ${i.title} (id ${result.insertId})`);
  }

  // ---- Students + CVs ----
  const student = {}; // key -> { id, user_id, universityId }
  for (const s of NEW_STUDENTS) {
    const userId = await ensureUser(s.full_name, s.email, "student");
    let studentRow = await Student.findByUserId(userId);
    let studentId;
    if (studentRow) {
      studentId = studentRow.id;
      console.log(`= student exists: ${s.full_name} (id ${studentId})`);
    } else {
      const result = await Student.create({
        user_id: userId,
        university_id: s.universityId,
        major: s.major,
        academic_year: s.academic_year,
        gpa: s.gpa,
        skills: s.skills.join(", "),
        status: "not_started",
      });
      studentId = result.insertId;
      console.log(`+ student created: ${s.full_name} (id ${studentId})`);
    }
    student[s.key] = { id: studentId, user_id: userId, universityId: s.universityId };

    await CV.upsert({
      student_id: studentId,
      cv_file: `demo-cv-${s.key}.pdf`,
      analysis_data: {
        Name: s.full_name,
        Email: s.email,
        Phone: "+970-59-0000000",
        Degree: `BSc ${s.major}`,
        GPA: s.gpa,
        Skills: s.skills,
        Experience: [],
        work_mode: s.work_mode,
      },
    });
  }

  // ---- AI Matching (real engine, same as /api/matching/student/:userId/run) ----
  console.log("\n---------------- Running AI matching ----------------\n");
  const matchIdByStudentInternship = {}; // "studentKey:internshipKey" -> match row id

  for (const s of NEW_STUDENTS) {
    const st = student[s.key];
    const cv = await CV.findByStudentId(st.id);
    const cvData = typeof cv.analysis_data === "string" ? JSON.parse(cv.analysis_data) : cv.analysis_data;

    const internships = await Internship.findByStudentUniversity(st.universityId);
    let matchCount = 0;
    for (const internship of internships) {
      const result = aiMatchingService.calculateMatch(
        cv.analysis_data,
        internship.requirements,
        internship.specialization,
        internship.min_gpa,
        internship.work_mode,
        cvData.GPA ?? s.gpa,
        cvData.work_mode
      );
      if (result.matchPercentage > 0) {
        await InternshipMatch.upsert({
          student_id: st.id,
          internship_id: internship.id,
          match_percentage: result.matchPercentage,
          matched_skills: result.matchedSkills,
          matched_categories: result.matchedCategories,
          gpa_match: result.gpaMatch,
          gpa_message: result.gpaMessage,
          work_mode_match: result.workModeMatch,
          work_mode_message: result.workModeMessage,
        });
        matchCount++;
      }
    }
    console.log(`  ${s.full_name}: ${matchCount} matches out of ${internships.length} visible internships`);
  }

  // ---- Applications, accept/reject ----
  console.log("\n---------------- Applications ----------------\n");
  const accepted = []; // { studentKey, internshipKey, matchId }

  for (const [studentKey, plan] of Object.entries(APPLICATION_PLAN)) {
    if (plan.outcome === "none") {
      console.log(`  ${studentKey}: browsing only, no application`);
      continue;
    }
    const st = student[studentKey];
    const iid = internshipId[plan.internshipKey];
    await InternshipMatch.applyToInternship(st.id, iid, 20);
    const match = await InternshipMatch.getByStudentAndInternship(st.id, iid);
    console.log(`  ${studentKey} applied to ${plan.internshipKey} (match id ${match.id}, ${match.match_percentage}%)`);

    if (plan.outcome === "accept") {
      await InternshipMatch.updateStatus(match.id, "accepted");
      accepted.push({ studentKey, internshipKey: plan.internshipKey, matchId: match.id, finalReport: !!plan.finalReport });
      console.log(`    -> accepted`);
    } else if (plan.outcome === "reject") {
      await InternshipMatch.updateStatus(match.id, "rejected");
      console.log(`    -> rejected`);
    } else {
      console.log(`    -> left pending`);
    }
  }

  // ---- Plans + weekly reports for accepted students ----
  console.log("\n---------------- Plans & weekly reports ----------------\n");

  const WEEK_TEMPLATES = [
    { title: "Onboarding & Environment Setup", objectives: "Get familiar with the team, tools and codebase.", tasks: "Set up dev environment, read documentation, meet the team." },
    { title: "Core Fundamentals", objectives: "Build foundational skills needed for the assigned track.", tasks: "Complete guided exercises and small code reviews." },
    { title: "First Real Task", objectives: "Contribute a first small feature or fix under supervision.", tasks: "Implement, test and submit a real task for review." },
    { title: "Independent Delivery", objectives: "Work more independently on a larger task.", tasks: "Deliver a feature end-to-end with trainer check-ins." },
  ];

  for (const a of accepted) {
    const iid = internshipId[a.internshipKey];
    const cId = NEW_INTERNSHIPS.find((i) => i.key === a.internshipKey).companyId
      ?? companyId[NEW_INTERNSHIPS.find((i) => i.key === a.internshipKey).companyKey];
    const tId = trainerByCompany[cId];
    if (!tId) {
      console.log(`  ! no trainer found for company ${cId}, skipping plan for ${a.studentKey}`);
      continue;
    }

    const internshipTitle = NEW_INTERNSHIPS.find((i) => i.key === a.internshipKey).title;
    const start = TODAY;
    const end = plusDays(TODAY, 56);

    const existingPlanRows = await dbRun(
      "SELECT id FROM internship_plans WHERE internship_id = ? AND trainer_id = ?",
      [iid, tId]
    );
    let planId;
    if (existingPlanRows.length > 0) {
      planId = existingPlanRows[0].id;
      console.log(`  = plan exists for ${internshipTitle} (id ${planId})`);
    } else {
      const planResult = await InternshipPlan.create({
        internship_id: iid,
        trainer_id: tId,
        title: `خطة تدريب — ${internshipTitle}`,
        description: `Structured 8-week training plan for the ${internshipTitle} position.`,
        duration_weeks: 8,
        start_date: isoDate(start),
        end_date: isoDate(end),
        status: "active",
      });
      planId = planResult.insertId;
      console.log(`  + plan created for ${internshipTitle} (id ${planId})`);

      let weekNum = 1;
      for (const w of WEEK_TEMPLATES) {
        await InternshipPlan.addWeek({
          plan_id: planId,
          week_number: weekNum,
          title: w.title,
          description: w.objectives,
          objectives: w.objectives,
          tasks: w.tasks,
          task_description: w.tasks,
          resources: "Internal docs, team wiki, mentor pairing sessions.",
          deliverables: "Short written summary + working code/demo.",
          due_date: plusDays(TODAY, weekNum * 7).toISOString(),
        });
        weekNum++;
      }
    }

    // Weekly reports: week 1 approved, week 2 pending
    const st = student[a.studentKey];
    const w1 = await WeeklyReport.create({
      student_id: st.id,
      university_id: st.universityId,
      plan_id: planId,
      week_number: 1,
      report_text: "أنجزت إعداد بيئة العمل والتعرف على الفريق وأدوات الشركة، وبدأت بمراجعة الكود الأساسي للمشروع.",
      report_file: null,
    });
    await WeeklyReport.universityReview(w1.insertId, true, "أداء جيد، استمر بنفس المستوى.");

    await WeeklyReport.create({
      student_id: st.id,
      university_id: st.universityId,
      plan_id: planId,
      week_number: 2,
      report_text: "عملت على أول مهمة حقيقية ضمن إشراف المدرب، وأنجزت جزءًا منها بانتظار المراجعة.",
      report_file: null,
    });
    console.log(`  reports submitted for ${a.studentKey} (week 1 approved, week 2 pending)`);

    if (a.finalReport) {
      const frResult = await FinalReport.create({
        trainer_id: tId,
        student_id: st.id,
        internship_id: iid,
        overall_performance: "طالبة متميزة أظهرت فهمًا قويًا للمفاهيم التقنية والتزامًا عاليًا طوال فترة التدريب.",
        technical_skills_rating: 5,
        communication_rating: 5,
        teamwork_rating: 4,
        problem_solving_rating: 5,
        attendance_rating: 5,
        overall_rating: 4.8,
      });
      await dbRun(
        "UPDATE final_reports SET university_approved = 1, university_approved_at = NOW() WHERE id = ?",
        [frResult.insertId]
      );
      console.log(`  + final report created & approved for ${a.studentKey} (id ${frResult.insertId})`);
    }
  }

  console.log("\n================ DONE ================\n");
  console.log("New student login credentials (password for all: " + PASSWORD + "):");
  for (const s of NEW_STUDENTS) console.log(`  ${s.full_name.padEnd(20)} ${s.email}`);
  console.log("\nNew trainer login credentials:");
  for (const t of NEW_TRAINERS) console.log(`  ${t.full_name.padEnd(20)} ${t.email}`);
  console.log("\nNew company login credentials:");
  for (const c of NEW_COMPANIES) console.log(`  ${c.name.padEnd(24)} ${c.email}`);

  db.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("SEED FAILED:", err);
  db.end();
  process.exit(1);
});
