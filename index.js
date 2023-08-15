require("dotenv").config();
const mysql = require("mysql2/promise");

const connection_config = {
  host     : process.env.DATABASE_HOST,
  port     : process.env.DATABASE_PORT,
  user     : process.env.DATABASE_USER,
  password : process.env.DATABASE_PASSWORD,
  database : process.env.DATABASE_NAME,
  connectionLimit: 10,
  connectTimeout: 100000,
};

function alpha_mark(value) {
  let alpha = "";
  if (value >= 95) alpha = 'A';
  else if (value >= 90) alpha = 'A-';
  else if (value >= 85) alpha = 'B+';
  else if (value >= 80) alpha = 'B';
  else if (value >= 75) alpha = 'B-';
  else if (value >= 70) alpha = 'C+';
  else if (value >= 65) alpha = 'C';
  else if (value >= 60) alpha = 'C-';
  else if (value >= 55) alpha = 'D+';
  else if (value >= 50) alpha = 'D';
  else if (value >= 25) alpha = 'FX';
  else alpha = 'F';
  return alpha;
}

function numeral_mark(value) {
  let num = 4;
  if (value >= 95) num = 4;
  else if (value>=90) num = 3.67;
  else if (value>=85) num = 3.33;
  else if (value>=80) num = 3;
  else if (value>=75) num = 2.67;
  else if (value>=70) num = 2.33;
  else if (value>=65) num = 2;
  else if (value>=60) num = 1.67;
  else if (value>=55) num = 1.33;
  else if (value>=50) num = 1;
  else num = 0;

  return num;
}

function traditional_mark(value) {
  let traditional = 5;
  if (value >= 90) traditional = 5;
  else if (value >= 70) traditional = 4;
  else if (value >= 50) traditional = 3;
  else traditional = 2;

  return traditional;
};

function get_year() {
  const current_date = new Date();
  const september_month = 9;
  const cur_month = current_date.getMonth()+1;
  const cur_year = current_date.getFullYear();
  if (cur_month < september_month) { return cur_year-1; }
  return cur_year;
}

async function get_totalmarks_by_year(con, year) {
  const query_str = `
    SELECT s.StudentID AS student_id,sg.StudyGroupID AS study_group_id,tm.queryID AS query_id,tm.subjectCode AS subject_code_id,tm.totalmark AS mark FROM totalmarks tm
    JOIN studygroups sg ON sg.StudyGroupID = tm.studygroupID
    JOIN students s ON s.StudentID = tm.studentID
    WHERE sg.year = ${year} AND sg.isMain = 1 AND sg.studentCount != 0 
      AND s.StudyFormID IN (3,4,6,8,13,14,19,20,24,25,30) AND s.isStudent = 1
      AND tm.totalmark != 0 AND tm.totalmark IS NOT NULL;
  `;

  const [ res ] = await con.query(query_str);
  return res;
}

async function update_trascript(con, student_id, query_id, total_mark, alpha_mark, numerical, traditional) {
  const update_str = `
    UPDATE transcript 
      SET AlphaMark       = '${alpha_mark}',
          NumeralMark     = ${numerical},
          TotalMark       = ${total_mark},
          traditionalMark = ${traditional}
      WHERE StudentID = ${student_id} 
        AND queryID   = ${query_id};
  `;

  //await con.query(update_str);
  console.log(update_str);
}

(async () => {
  const con = await mysql.createConnection(connection_config);

  const year = get_year();
  const totalmarks = await get_totalmarks_by_year(con, year);

  console.log(year);
  console.log(totalmarks.length);
  for (const mark_data of totalmarks) {
    const alpha = alpha_mark(mark_data.mark);
    const numeral = numeral_mark(mark_data.mark);
    const traditional = traditional_mark(mark_data.mark);

    //await update_trascript(con, mark_data.student_id, mark_data.query_id, mark_data.mark, alpha, numeral, traditional);
  }

  await con.end();
})();
