// One-off script: add a few more students with varying skill overlap and
// apply each of them to MedTech Solutions' Frontend Developer Intern
// posting (internship id 13), to get a realistic spread of match percentages
// for the company's applicant list.
import User from "../models/User.js";
import Student from "../models/Student.js";
import Internship from "../models/Internship.js";
import CV from "../models/CV.js";
import InternshipMatch from "../models/InternshipMatch.js";
import aiMatchingService from "../services/aiMatchingService.js";

const PASSWORD = "Trainix@2026";
const MEDTECH_INTERNSHIP_ID = 13;

const NEW_STUDENTS = [
  {
    full_name: "Yousef Amro",
    email: "yousef.amro@stu.birzeit.edu",
    universityId: 2, // Birzeit
    major: "Computer Science",
    academic_year: "Year 3",
    gpa: 3.20,
    work_mode: "remote",
    skills: ["JavaScript", "CSS", "Git"],
  },
  {
    full_name: "Adam Khalil",
    email: "adam.khalil@stu.birzeit.edu",
    universityId: 2, // Birzeit
    major: "Computer Engineering",
    academic_year: "Year 2",
    gpa: 3.50,
    work_mode: "hybrid",
    skills: ["Python", "MySQL", "Git"],
  },
  {
    full_name: "Lina Tamimi",
    email: "lina.tamimi@stu.najah.edu",
    universityId: 1, // An-Najah
    major: "Information Technology",
    academic_year: "Year 2",
    gpa: 2.90,
    work_mode: "on-site",
    skills: ["HTML", "Bootstrap"],
  },
];

async function ensureUser(full_name, email, user_type) {
  const existing = await User.findByEmail(email);
  if (existing) return existing.id;
  const result = await User.create({ full_name, email, password: PASSWORD, user_type });
  return result.insertId;
}

async function main() {
  for (const s of NEW_STUDENTS) {
    const userId = await ensureUser(s.full_name, s.email, "student");
    let studentRow = await Student.findByUserId(userId);
    let studentId;
    if (studentRow) {
      studentId = studentRow.id;
      console.log(`= student already exists: ${s.full_name} (id ${studentId})`);
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

    await CV.upsert({
      student_id: studentId,
      cv_file: `demo-cv-${s.full_name.split(" ")[0].toLowerCase()}.pdf`,
      analysis_data: {
        Name: s.full_name,
        Email: s.email,
        Phone: "+970-59-3334445",
        Degree: `BSc ${s.major}`,
        GPA: s.gpa,
        Skills: s.skills,
        Experience: [],
        work_mode: s.work_mode,
      },
    });

    const cv = await CV.findByStudentId(studentId);
    const cvData = typeof cv.analysis_data === "string" ? JSON.parse(cv.analysis_data) : cv.analysis_data;
    const internships = await Internship.findByStudentUniversity(s.universityId);

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
      }
    }

    await InternshipMatch.applyToInternship(studentId, MEDTECH_INTERNSHIP_ID, 20);
    const match = await InternshipMatch.getByStudentAndInternship(studentId, MEDTECH_INTERNSHIP_ID);
    console.log(`  -> applied to MedTech Frontend Developer Intern: ${match.match_percentage}% match (status: ${match.status})`);
  }

  console.log(`\nAll new accounts use password: ${PASSWORD}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
