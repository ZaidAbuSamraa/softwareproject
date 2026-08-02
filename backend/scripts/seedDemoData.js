// One-off seed script: fills the database with demo data for local testing.
// Safe to re-run: skips inserts if demo users already exist (checked by email).
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

const PASSWORD_HASH = await bcrypt.hash("Test@123", 10);

async function insertUser(full_name, email, user_type) {
  const [existing] = await db.execute("SELECT id FROM Users WHERE email = ?", [email]);
  if (existing.length) return existing[0].id;
  const [result] = await db.execute(
    "INSERT INTO Users (full_name, email, password, user_type) VALUES (?, ?, ?, ?)",
    [full_name, email, PASSWORD_HASH, user_type]
  );
  return result.insertId;
}

async function main() {
  console.log("Seeding demo data...");

  // ---------------- Universities ----------------
  const universities = [
    { name: "An-Najah National University", email: "info@najah.edu", location: "Nablus, Palestine", website: "https://www.najah.edu", description: "Leading university in Palestine offering diverse academic programs." },
    { name: "Birzeit University", email: "info@birzeit.edu", location: "Birzeit, Palestine", website: "https://www.birzeit.edu", description: "One of the oldest and most prestigious universities in Palestine." },
    { name: "Palestine Technical University - Kadoorie", email: "info@ptuk.edu.ps", location: "Tulkarm, Palestine", website: "https://www.ptuk.edu.ps", description: "Technical and vocational education specialist university." },
  ];

  const universityIds = {};
  for (const uni of universities) {
    const userId = await insertUser(uni.name, uni.email, "university");
    const [existing] = await db.execute("SELECT id FROM Universities WHERE email = ?", [uni.email]);
    let uniId;
    if (existing.length) {
      uniId = existing[0].id;
    } else {
      const [result] = await db.execute(
        "INSERT INTO Universities (name, email, location, website, description, coordinator_name, domain) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [uni.name, uni.email, uni.location, uni.website, uni.description, "Dr. Coordinator", uni.email.split("@")[1]]
      );
      uniId = result.insertId;
    }
    universityIds[uni.name] = uniId;
    void userId;
  }

  // ---------------- Companies ----------------
  const companies = [
    { name: "ITG - Information Technology Group", email: "hr@itg.ps", industry: "Software Development", location: "Ramallah, Palestine", website: "https://itg.ps", description: "Software development and IT consulting company." },
    { name: "Exalt Technologies", email: "careers@exalt.ps", industry: "Software Development", location: "Ramallah, Palestine", website: "https://exalt.ps", description: "Technology company specializing in software outsourcing." },
    { name: "Foothill Technology Solutions", email: "hr@foothill.com", industry: "IT Services", location: "Nablus, Palestine", website: "https://foothill.com", description: "IT services and technology solutions provider." },
    { name: "Ghadeer Business Management", email: "hr@ghadeer.com", industry: "Business Consulting", location: "Nablus, Palestine", website: "https://ghadeer.com", description: "Business management and consulting services." },
  ];

  const companyIds = {};
  for (const c of companies) {
    const userId = await insertUser(c.name, c.email, "company");
    const [existing] = await db.execute("SELECT id FROM Company WHERE email = ?", [c.email]);
    let companyId;
    if (existing.length) {
      companyId = existing[0].id;
    } else {
      const [result] = await db.execute(
        "INSERT INTO Company (name, email, industry, description, website, location, status, coordinator_name) VALUES (?, ?, ?, ?, ?, ?, 'active', ?)",
        [c.name, c.email, c.industry, c.description, c.website, c.location, "Coordinator Name"]
      );
      companyId = result.insertId;
    }
    companyIds[c.name] = companyId;
    void userId;
  }

  // ---------------- Trainers ----------------
  const trainers = [
    { name: "Ahmad Trainer", email: "ahmad.trainer@itg.ps", company: "ITG - Information Technology Group", spec: "Full-Stack Development", years: 5, bio: "Senior developer mentoring interns in web technologies." },
    { name: "Sara Trainer", email: "sara.trainer@exalt.ps", company: "Exalt Technologies", spec: "Data Science", years: 4, bio: "Data scientist supervising AI/ML interns." },
    { name: "Khaled Trainer", email: "khaled.trainer@foothill.com", company: "Foothill Technology Solutions", spec: "Network Engineering", years: 6, bio: "Network engineer supervising IT interns." },
  ];

  const trainerIds = {};
  for (const t of trainers) {
    const userId = await insertUser(t.name, t.email, "trainer");
    const [existing] = await db.execute("SELECT id FROM Trainers WHERE user_id = ?", [userId]);
    let trainerId;
    if (existing.length) {
      trainerId = existing[0].id;
    } else {
      const [result] = await db.execute(
        "INSERT INTO Trainers (user_id, company_id, specialization, experience_years, bio, status) VALUES (?, ?, ?, ?, ?, 'active')",
        [userId, companyIds[t.company], t.spec, t.years, t.bio]
      );
      trainerId = result.insertId;
    }
    trainerIds[t.email] = trainerId;
  }

  // ---------------- Students ----------------
  const students = [
    { name: "Mohammed Ali", email: "mohammed.ali@stu.najah.edu", uni: "An-Najah National University", major: "Computer Science", year: "4th Year", gpa: 3.75, skills: "JavaScript, React, Node.js, SQL", status: "in_progress" },
    { name: "Lina Yousef", email: "lina.yousef@stu.najah.edu", uni: "An-Najah National University", major: "Software Engineering", year: "3rd Year", gpa: 3.9, skills: "Python, Machine Learning, Pandas, TensorFlow", status: "not_started" },
    { name: "Omar Khalil", email: "omar.khalil@stu.birzeit.edu", uni: "Birzeit University", major: "Information Technology", year: "4th Year", gpa: 3.4, skills: "Java, Spring Boot, MySQL", status: "not_started" },
    { name: "Rana Nasser", email: "rana.nasser@stu.birzeit.edu", uni: "Birzeit University", major: "Computer Science", year: "2nd Year", gpa: 3.6, skills: "HTML, CSS, JavaScript, Figma", status: "not_started" },
    { name: "Yousef Odeh", email: "yousef.odeh@stu.ptuk.edu.ps", uni: "Palestine Technical University - Kadoorie", major: "Network Engineering", year: "4th Year", gpa: 3.2, skills: "Networking, Linux, Cisco, Security", status: "completed" },
    { name: "Nour Salem", email: "nour.salem@stu.najah.edu", uni: "An-Najah National University", major: "Computer Science", year: "3rd Year", gpa: 3.55, skills: "C++, Data Structures, Algorithms", status: "in_progress" },
  ];

  const studentIds = {};
  for (const s of students) {
    const userId = await insertUser(s.name, s.email, "student");
    const [existing] = await db.execute("SELECT id FROM Students WHERE user_id = ?", [userId]);
    let studentId;
    if (existing.length) {
      studentId = existing[0].id;
    } else {
      const [result] = await db.execute(
        "INSERT INTO Students (user_id, university_id, major, academic_year, gpa, skills, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [userId, universityIds[s.uni], s.major, s.year, s.gpa, s.skills, s.status]
      );
      studentId = result.insertId;
    }
    studentIds[s.email] = studentId;
  }

  // ---------------- Internships ----------------
  const internships = [
    { company: "ITG - Information Technology Group", title: "Frontend Developer Intern", description: "Work on React-based web applications with our frontend team.", requirements: "Knowledge of HTML, CSS, JavaScript, React", specialization: "Web Development", capacity: 3, min_gpa: 2.5, work_mode: "hybrid", duration: "3 months" },
    { company: "ITG - Information Technology Group", title: "Backend Developer Intern", description: "Build and maintain REST APIs using Node.js and MySQL.", requirements: "Basic knowledge of Node.js, databases", specialization: "Backend Development", capacity: 2, min_gpa: 2.75, work_mode: "on-site", duration: "3 months" },
    { company: "Exalt Technologies", title: "Data Science Intern", description: "Assist in building machine learning models for real business problems.", requirements: "Python, statistics, ML basics", specialization: "Data Science", capacity: 2, min_gpa: 3.0, work_mode: "remote", duration: "4 months" },
    { company: "Foothill Technology Solutions", title: "Network Support Intern", description: "Support the IT infrastructure team with network monitoring and maintenance.", requirements: "Basic networking knowledge, Linux basics", specialization: "Network Engineering", capacity: 2, min_gpa: 2.5, work_mode: "on-site", duration: "2 months" },
    { company: "Ghadeer Business Management", title: "Business Analyst Intern", description: "Support business process analysis and documentation.", requirements: "Analytical skills, MS Office", specialization: "Business Administration", capacity: 1, min_gpa: 2.5, work_mode: "hybrid", duration: "3 months" },
  ];

  const internshipIds = {};
  for (const i of internships) {
    const [existing] = await db.execute("SELECT id FROM Internships WHERE title = ? AND company_id = ?", [i.title, companyIds[i.company]]);
    let internshipId;
    if (existing.length) {
      internshipId = existing[0].id;
    } else {
      const [result] = await db.execute(
        `INSERT INTO Internships (company_id, title, description, requirements, specialization, capacity, status, min_gpa, work_mode, duration, start_date, end_date)
         VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 4 MONTH))`,
        [companyIds[i.company], i.title, i.description, i.requirements, i.specialization, i.capacity, i.min_gpa, i.work_mode, i.duration]
      );
      internshipId = result.insertId;
    }
    internshipIds[i.title] = internshipId;
  }

  // ---------------- Internship Matches (applications) ----------------
  const matches = [
    { student: "mohammed.ali@stu.najah.edu", internship: "Frontend Developer Intern", pct: 88.5, applied: true, status: "accepted" },
    { student: "lina.yousef@stu.najah.edu", internship: "Data Science Intern", pct: 92.0, applied: true, status: "pending" },
    { student: "omar.khalil@stu.birzeit.edu", internship: "Backend Developer Intern", pct: 75.0, applied: true, status: "pending" },
    { student: "rana.nasser@stu.birzeit.edu", internship: "Frontend Developer Intern", pct: 70.0, applied: false, status: "pending" },
    { student: "yousef.odeh@stu.ptuk.edu.ps", internship: "Network Support Intern", pct: 95.0, applied: true, status: "accepted" },
    { student: "nour.salem@stu.najah.edu", internship: "Backend Developer Intern", pct: 66.0, applied: false, status: "pending" },
  ];

  for (const m of matches) {
    const studentId = studentIds[m.student];
    const internshipId = internshipIds[m.internship];
    const [existing] = await db.execute("SELECT id FROM Internship_Matches WHERE student_id = ? AND internship_id = ?", [studentId, internshipId]);
    if (existing.length) continue;
    await db.execute(
      `INSERT INTO Internship_Matches (student_id, internship_id, match_percentage, matched_skills, applied, applied_at, status)
       VALUES (?, ?, ?, ?, ?, ${m.applied ? "NOW()" : "NULL"}, ?)`,
      [studentId, internshipId, m.pct, JSON.stringify(["skills matched"]), m.applied, m.status]
    );
  }

  // ---------------- University-Company Partnerships ----------------
  const partnerships = [
    { uni: "An-Najah National University", company: "ITG - Information Technology Group", hours: 300 },
    { uni: "An-Najah National University", company: "Exalt Technologies", hours: 300 },
    { uni: "Birzeit University", company: "Foothill Technology Solutions", hours: 250 },
    { uni: "Palestine Technical University - Kadoorie", company: "Ghadeer Business Management", hours: 200 },
  ];

  for (const p of partnerships) {
    const [existing] = await db.execute(
      "SELECT id FROM University_Company_Partnerships WHERE university_id = ? AND company_id = ?",
      [universityIds[p.uni], companyIds[p.company]]
    );
    if (existing.length) continue;
    await db.execute(
      "INSERT INTO University_Company_Partnerships (university_id, company_id, status, training_hours, start_date) VALUES (?, ?, 'active', ?, CURDATE())",
      [universityIds[p.uni], companyIds[p.company], p.hours]
    );
  }

  // ---------------- Registration Requests (pending demo) ----------------
  const [existingReq] = await db.execute("SELECT id FROM Registration_Requests WHERE email = ?", ["newcompany@example.com"]);
  if (!existingReq.length) {
    await db.execute(
      "INSERT INTO Registration_Requests (full_name, email, password, user_type, status) VALUES (?, ?, ?, 'company', 'pending')",
      ["New Startup Co.", "newcompany@example.com", PASSWORD_HASH]
    );
  }

  // ---------------- Notifications (demo) ----------------
  const [adminUser] = await db.execute("SELECT id FROM Users WHERE email = 'admin@trainix.com'");
  if (adminUser.length) {
    const [existingNotif] = await db.execute("SELECT id FROM notifications WHERE user_id = ? AND title = ?", [adminUser[0].id, "Welcome to Trainix"]);
    if (!existingNotif.length) {
      await db.execute(
        "INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Welcome to Trainix', 'Demo data has been loaded successfully.', 'general')",
        [adminUser[0].id]
      );
    }
  }

  console.log("Demo data seeded successfully.");
  console.log("All demo accounts use password: Test@123");
  await db.end();
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
