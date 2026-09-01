import db from "../config/database.js";

class University {
  // Create a new university
  static create(universityData) {
    const { 
      name, 
      email, 
      phone, 
      address, 
      website, 
      logo, 
      coordinator_name, 
      coordinator_phone
    } = universityData;
    
    // Extract domain from email
    const domain = email ? email.split('@')[1] : null;
    
    const query = `
      INSERT INTO Universities (name, email, domain, phone, address, website, logo, coordinator_name, coordinator_phone) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    return new Promise((resolve, reject) => {
      db.query(
        query, 
        [name, email, domain, phone, address, website, logo, coordinator_name, coordinator_phone], 
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
  }

  // Find university by ID
  static findById(id) {
    const query = `
      SELECT u.*, us.id as user_id 
      FROM Universities u
      LEFT JOIN Users us ON u.email = us.email AND us.user_type = 'university'
      WHERE u.id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(query, [id], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]);
        }
      });
    });
  }

  // Find university by email
  static findByEmail(email) {
    const query = "SELECT * FROM Universities WHERE email = ?";
    
    return new Promise((resolve, reject) => {
      db.query(query, [email], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]);
        }
      });
    });
  }

  // Find university by domain (e.g., najah.com)
  // Matches the university's own domain (najah.edu) as well as its
  // subdomains (stu.najah.edu, cs.najah.edu, ...), since students and staff
  // sign up with addresses on a subdomain of the university's domain.
  static findByDomain(domain) {
    // ORDER BY id ASC makes the match deterministic if more than one
    // university row happens to share the same domain.
    const query = "SELECT * FROM Universities WHERE domain = ? OR ? LIKE CONCAT('%.', domain) ORDER BY id ASC";

    return new Promise((resolve, reject) => {
      db.query(query, [domain, domain], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]);
        }
      });
    });
  }

  // Get all universities
  static getAll() {
    const query = "SELECT * FROM Universities ORDER BY name ASC";
    
    return new Promise((resolve, reject) => {
      db.query(query, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Update university
  static update(id, universityData) {
    const { 
      name, 
      email, 
      phone, 
      address, 
      website, 
      logo, 
      coordinator_name, 
      coordinator_phone
    } = universityData;
    
    // Extract domain from email
    const domain = email ? email.split('@')[1] : null;
    
    const query = `
      UPDATE Universities 
      SET name = ?, email = ?, domain = ?, phone = ?, address = ?, 
          website = ?, logo = ?, coordinator_name = ?, coordinator_phone = ?
      WHERE id = ?
    `;
    
    return new Promise((resolve, reject) => {
      db.query(
        query, 
        [name, email, domain, phone, address, website, logo, coordinator_name, coordinator_phone, id], 
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
  }

  // Delete university
  static delete(id) {
    const query = "DELETE FROM Universities WHERE id = ?";
    
    return new Promise((resolve, reject) => {
      db.query(query, [id], (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  // Search universities by name
  static search(searchTerm) {
    const query = `
      SELECT * FROM Universities 
      WHERE name LIKE ? OR address LIKE ? 
      ORDER BY name ASC
    `;
    const searchPattern = `%${searchTerm}%`;
    
    return new Promise((resolve, reject) => {
      db.query(query, [searchPattern, searchPattern], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

}

export default University;
