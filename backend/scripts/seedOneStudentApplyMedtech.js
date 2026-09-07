// One-off script: create a single new student and have them apply to
// MedTech Solutions' Frontend Developer Intern posting (internship id 13),
// using the real model/service pipeline (same code path as the app).
import db from "../config/database.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Internship from "../models/Internship.js";
import CV from "../models/CV.js";
import InternshipMatch from "../models/InternshipMatch.js";
import aiMatchingService from "../services/aiMatchingService.js";

const PASSWORD = "Trainix@2026";

const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) => db.query(sql, params, (err, r) => (err ? reject(err) : resolve(r))));

const [najahRow] = await dbRun("SELECT id FROM Universities WHERE domain LIKE '%najah.edu%' LIMIT 1");
const [medtechInternshipRow] = await dbRun(
  "SELECT i.id FROM Internships i JOIN Company c ON i.company_id = c.id WHERE c.email = 'careers@medtechps.com' LIMIT 1"
);
const NAJAH_ID = najahRow.id;
const MEDTECH_INTERNSHIP_ID = medtechInternshipRow.id;

const NEW_STUDENT = {
  full_name: "Salma Khader",
  email: "salma.khader@stu.najah.edu",
  universityId: NAJAH_ID,
  major: "Computer Science",
  academic_year: "Year 3",
  gpa: 3.30,
  work_mode: "remote",
  skills: ["HTML", "CSS", "JavaScript", "React", "Git", "Responsive Design"],
};

async function ensureUser(full_name, email, user_type) {
  const existing = await User.findByEmail(email);
  if (existing) return existing.id;
  const result = await User.create({ full_name, email, password: PASSWORD, user_type });
  return result.insertId;
}

async function main() {
  const userId = await ensureUser(NEW_STUDENT.full_name, NEW_STUDENT.email, "student");
  let studentRow = await Student.findByUserId(userId);
  let studentId;
  if (studentRow) {
    studentId = studentRow.id;
    console.log(`= student already exists: ${NEW_STUDENT.full_name} (id ${studentId})`);
  } else {
    const result = await Student.create({
      user_id: userId,
      university_id: NEW_STUDENT.universityId,
      major: NEW_STUDENT.major,
      academic_year: NEW_STUDENT.academic_year,
      gpa: NEW_STUDENT.gpa,
      skills: NEW_STUDENT.skills.join(", "),
      status: "not_started",
    });
    studentId = result.insertId;
    console.log(`+ student created: ${NEW_STUDENT.full_name} (id ${studentId})`);
  }

  await CV.upsert({
    student_id: studentId,
    cv_file: `demo-cv-salma.pdf`,
    analysis_data: {
      Name: NEW_STUDENT.full_name,
      Email: NEW_STUDENT.email,
      Phone: "+970-59-1112223",
      Degree: `BSc ${NEW_STUDENT.major}`,
      GPA: NEW_STUDENT.gpa,
      Skills: NEW_STUDENT.skills,
      Experience: [],
      work_mode: NEW_STUDENT.work_mode,
    },
  });
  console.log("+ CV upserted with frontend-oriented skills");

  // Run AI matching against every internship visible to this student
  // (same logic as POST /api/matching/student/:userId/run)
  const cv = await CV.findByStudentId(studentId);
  const cvData = typeof cv.analysis_data === "string" ? JSON.parse(cv.analysis_data) : cv.analysis_data;
  const internships = await Internship.findByStudentUniversity(NEW_STUDENT.universityId);

  let matchCount = 0;
  for (const internship of internships) {
    const result = aiMatchingService.calculateMatch(
      cv.analysis_data,
      internship.requirements,
      internship.specialization,
      internship.min_gpa,
      internship.work_mode,
      cvData.GPA ?? NEW_STUDENT.gpa,
      cvData.work_mode
    );
    if (result.matchPercentage > 0) {
      await InternshipMatch.upsert({
        student_id: studentId,
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
  console.log(`+ AI matching run: ${matchCount} matches out of ${internships.length} visible internships`);

  // Apply to MedTech's Frontend Developer Intern posting
  await InternshipMatch.applyToInternship(studentId, MEDTECH_INTERNSHIP_ID, 20);
  const match = await InternshipMatch.getByStudentAndInternship(studentId, MEDTECH_INTERNSHIP_ID);
  console.log(`+ applied to MedTech Frontend Developer Intern (match id ${match.id}, ${match.match_percentage}% match, status: ${match.status})`);

  console.log("\nLogin as this student with:");
  console.log(`  email: ${NEW_STUDENT.email}`);
  console.log(`  password: ${PASSWORD}`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
