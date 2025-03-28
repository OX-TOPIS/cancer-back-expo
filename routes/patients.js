const express = require("express");
const pool = require("../config");
const app = express();
const cors = require("cors");
const moment = require("moment");
const path = require("path");
const { Parser } = require("json2csv");
const csv = require("csv-parser");

const fileUpload = require("express-fileupload");
const uploadOpts = {
  useTempFiles: true,
  tempFileDir: "/tmp/",
};

const XLSX = require("xlsx");
const fs = require("fs");
const multer = require("multer");
const upload = multer({ dest: "uploads/xlsx" });

const stroage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + path.extname(file.originalname));
  },
});
const imgUpload = multer({ storage: stroage });

app.use(cors());
// app.use(cors({
//   origin: 'https://p6l7k2jx-5173.asse.devtunnels.ms', // Frontend URL
//   methods: 'GET, POST, PUT, DELETE'
// }));

router = express.Router();

router.get("/patients", async function (req, res, next) {
  try {
    const [rows, _] = await pool.query(
      "SELECT * FROM patient join history on patient.HN=history.HN"
    );
    res.json(rows);
  } catch (error) {
    console.log(error);
  }
});

router.get("/patients/:HN", async function (req, res, next) {
  const HN = req.params.HN;
  try {
    const [rows, _] = await pool.query(
      "SELECT * FROM PATIENT join history on patient.HN=history.HN join allergy on patient.HN=allergy.HN WHERE patient.HN=?",
      HN
    );
    res.json(rows);
  } catch (error) {
    console.log(error);
  }
});

router.get("/patients/doctor/:doctorId", async function (req, res, next) {
  const doctorId = req.params.doctorId;
  try {
    const [rows, _] = await pool.query(
      "SELECT firstName as doctorFirstName, lastName as doctorLastName FROM doctor join user on user.userId=doctor.doctorId WHERE doctorId=?",
      doctorId
    );
    res.json(rows);
  } catch (error) {
    console.log(error);
  }
});

router.post(`/sortInfo`, async function (req, res, next) {
  const sortInfo = req.body.sortInfo;
  let data = new Array();
  let cancer = new Array();
  const [rows, fs] = await pool.query(
    `select max(brId) as brId, patient.HN from bloodresult join treatment on treatment.treatmentId=bloodresult.treatmentId join patient on treatment.HN=patient.HN group by treatment.treatmentId`
  );
  try {
    if (sortInfo == "1") {
      for (let i = 0; i < rows.length; i++) {
        const [row, _] = await pool.query(
          `select * from treatment join patient on patient.HN=treatment.HN join bloodresult on treatment.treatmentId=bloodresult.treatmentId where brId = ? order by firstName asc`,
          [rows[i].brId]
        );
        const [row1, f1] = await pool.query(
          `select * from patient join cancer_patient on patient.HN=cancer_patient.HN join cancer on cancer.cancerId=cancer_patient.cancerId join treatment on treatment.HN=patient.HN join bloodresult on treatment.treatmentId=bloodresult.treatmentId where brId = ?`,
          rows[i].brId
        );
        for (j = 0; j < row1.length; j++) {
          cancer.push(row1[j]);
        }
        row[0].cancer = cancer;
        data.push(row[0]);
      }
    } else if (sortInfo == "2") {
      for (let i = 0; i < rows.length; i++) {
        const [row, _] = await pool.query(
          `select * from treatment join patient on patient.HN=treatment.HN join bloodresult on treatment.treatmentId=bloodresult.treatmentId where brId = ? order by firstName desc`,
          [rows[i].brId]
        );
        const [row1, f1] = await pool.query(
          `select * from patient join cancer_patient on patient.HN=cancer_patient.HN join cancer on cancer.cancerId=cancer_patient.cancerId join treatment on treatment.HN=patient.HN join bloodresult on treatment.treatmentId=bloodresult.treatmentId where brId = ?`,
          rows[i].brId
        );
        for (j = 0; j < row1.length; j++) {
          cancer.push(row1[j]);
        }
        row[0].cancer = cancer;
        data.push(row[0]);
      }
    } else if (sortInfo == "3") {
      for (let i = 0; i < rows.length; i++) {
        const [row, _] = await pool.query(
          `select * from treatment join patient on patient.HN=treatment.HN join bloodresult on treatment.treatmentId=bloodresult.treatmentId where brId = ? order by patient.HN asc`,
          [rows[i].brId]
        );
        const [row1, f1] = await pool.query(
          `select * from patient join cancer_patient on patient.HN=cancer_patient.HN join cancer on cancer.cancerId=cancer_patient.cancerId join treatment on treatment.HN=patient.HN join bloodresult on treatment.treatmentId=bloodresult.treatmentId where brId = ?`,
          rows[i].brId
        );
        for (j = 0; j < row1.length; j++) {
          cancer.push(row1[j]);
        }
        row[0].cancer = cancer;
        data.push(row[0]);
      }
    } else if (sortInfo == "4") {
      for (let i = 0; i < rows.length; i++) {
        const [row, _] = await pool.query(
          `select * from treatment join patient on patient.HN=treatment.HN join bloodresult on treatment.treatmentId=bloodresult.treatmentId where brId = ? order by patient.HN desc`,
          [rows[i].brId]
        );
        const [row1, f1] = await pool.query(
          `select * from patient join cancer_patient on patient.HN=cancer_patient.HN join cancer on cancer.cancerId=cancer_patient.cancerId join treatment on treatment.HN=patient.HN join bloodresult on treatment.treatmentId=bloodresult.treatmentId where brId = ?`,
          rows[i].brId
        );
        for (j = 0; j < row1.length; j++) {
          cancer.push(row1[j]);
        }
        row[0].cancer = cancer;
        data.push(row[0]);
      }
    }
    res.json(data);
  } catch (error) {
    console.log(error);
  }
});

router.put("/updatePatient/:HN", async function (req, res, next) {
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const phoneNumber = req.body.phoneNumber;
  const gender = req.body.gender;
  const birthDate = req.body.birthDate;
  const cancerType = req.body.cancerType;
  const cancerState = req.body.cancerState;
  const doctor = req.body.doctor.split(" ");
  const doctor_firstName = doctor[0];
  const doctor_lastName = doctor[1];
  const formula = req.body.formula;
  const [row, f] = await pool.query(
    "select formulaId from formula where formulaName = ?",
    formula
  );
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {8
    const [rows1, f1] = await conn.query(
      "select doctorId from doctor where firstName = ? and lastName = ?",
      [doctor_firstName, doctor_lastName]
    );
    await conn.query(
      "update patient set firstName=?, lastName=?, birthDate=?, gender=?, cancerType=?, cancerState=?, phoneNumber=?, doctorId=?, formulaId = ? where HN=?",
      [
        firstName,
        lastName,
        birthDate,
        gender,
        cancerType,
        Number(cancerState),
        phoneNumber,
        rows1[0].doctorId,
        row[0].formulaId,
        req.params.HN,
      ]
    );
    res.send("แก้ไขข้อมูลเสร็จสิ้น");
    conn.commit();
  } catch (error) {
    conn.rollback();
    console.log(error);
  } finally {
    conn.release();
  }
});

router.post(
  "/importPatients",
  fileUpload(uploadOpts),
  async function (req, res, next) {
    try {
      const excel = req.files;
      console.log(excel);
      if (
        excel.mimetype !=
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        fs.unlinkSync(excel.tempFilePath);
        return res.status(400).json({ msg: "File is invalid" });
      }

      //const successData = []
      //const failData = []

      const workbook = XLSX.readFile(excel);
      const sheetName = workbook.SheetNames[0];
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      //const conn = await pool.getConnection()
      //await conn.beginTransaction()

      for (let i = 0; i < data.length; i++) {
        const { HN, firstName, lastName } = data[i];
        //const [row, _] = await conn.query(`insert into patient (HN, firstName, lastName, birthDate, gender, phoneNumber, cancerType, cancerState, status, doctorId) values (?, ?, ?)`, [HN, firstName, lastName])
        if (row.affectedRows) {
          successData.push(data[i]);
        } else {
          failData.push(data[i]);
        }
      }
      fs.unlinkSync(excel.tempFilePath);
      return res.json({ data: { successData, failData } });
      //conn.commit()
    } catch (error) {
      //conn.rollback()
      console.log(error);
    } /*finally {
        conn.release()
    }*/
  }
);

router.post(
  "/uploadPatients",
  upload.single("file"),
  async function (req, res, next) {
    const workbook = XLSX.readFile(req.file.path);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      for (let i = 0; i < data.length; i++) {
        const {
          HN,
          ชื่อ,
          นามสกุล,
          วันเดือนปีเกิด,
          เพศ,
          เบอร์โทรศัพท์,
          ประเภทมะเร็ง,
          ระยะ,
          หมอ,
        } = data[i];
        let doctor_firstName = หมอ.split(" ")[0];
        let doctor_lastName = หมอ.split(" ")[1];
        const [row1, f1] = await conn.query(
          "select doctorId from doctor where firstName = ? and lastName = ?",
          [doctor_firstName, doctor_lastName]
        );
        const [row, _] = await conn.query(
          "insert into patient (HN, firstName, lastName, birthDate, gender, phoneNumber, cancerType, cancerState, status, doctorId) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            HN,
            ชื่อ,
            นามสกุล,
            วันเดือนปีเกิด,
            เพศ,
            เบอร์โทรศัพท์,
            ประเภทมะเร็ง,
            ระยะ,
            "รอการดำเนินการ",
            row1[0].doctorId,
          ]
        );
      }
      conn.commit();
    } catch (error) {
      conn.rollback();
      console.log(error);
    } finally {
      conn.release();
    }
  }
);

var data_exporter = require("json2csv").Parser;

router.get("/exportPatients", async function (req, res, next) {
  //export csv
  try {
    /*var aspose = aspose || {};
        aspose.cells = require("aspose.cells");

        var workbook = aspose.cells.Workbook()
        var worksheet = workbook.getWorksheets().get(0)
        var layoutOptions = aspose.cells.JsonLayoutOptions()
        layoutOptions.setArrayAsTable(true)

        const [row, _] = await pool.query('select * from patient')
        aspose.cells.JsonUtility.importData(row, worksheet.getCells(), 0, 0, layoutOptions)
        workbook.save("output.csv", aspose.cells.SaveFormat.CSV)*/
    const [row, _] = await pool.query("select * from patient");
    /*const writer = csvWriter.createObjectCsvWriter({
            path: path.resolve(__dirname, 'test1.csv'),
            header: [
                { id: 'HN', title: 'HN' },
                { id: 'fisrtName', title: 'ชื่อ' },
                { id: 'lastName', title: 'นามสกุล' },
                { id: 'BirthDate', title: ' วัน เดือน ปีเกิด' },
            ],
        });
        writer.writeRecords(row).then(() => {
            console.log('Done!');
        });*/
    let mysql_data = JSON.parse(JSON.stringify(row));
    var file_header = [
      "HN",
      "firstName",
      "lastName",
      "birthDate",
      "gender",
      "phoneNumber",
      "cancerType",
      "cancerState",
    ];
    var json_data = new data_exporter({ file_header });
    var csv_data = json_data.parse(mysql_data);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment;filename=example.csv");
    res.status(200).end(csv_data);
  } catch (error) {
    console.log(error);
  }
});









//ผลเลือด ของพี่ ส่งแบบ array ไฟล์แรก UPDATE IN DATABASE
// router.post(
//   "/uploadBloodResult",
//   imgUpload.array("images", 10), // รองรับการอัพโหลดได้สูงสุด 10 ไฟล์
//   async function (req, res, next) {
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).send("No files were uploaded.");
//     }

//     const files = req.files;
//     const firstFile = files[0];
//     const otherFiles = files.slice(1); // ไฟล์ที่ 2 ถึง 10

//     let firstFilename = "images/" + firstFile.filename;
//     let date = moment(Date.now()).format();

//     try {
//       const [row, _] = await pool.query(
//         `SELECT MAX(treatmentId) AS treatmentId FROM treatment JOIN patient ON treatment.HN=patient.HN WHERE treatment.IDcard = ?`,
//         req.body.IDcard
//       );
//       console.log(row[0].treatmentId, "row[0].treatmentId");

//       const [row_1, f_1] = await pool.query(
//         `SELECT MAX(brId) AS brId FROM bloodresult WHERE treatmentId = ?`,
//         row[0].treatmentId
//       );
//       console.log(row_1, "row_1");

//       const [row1, f1] = await pool.query(
//         `SELECT * FROM bloodresult WHERE brId = ?`,
//         row_1[0].brId
//       );

//       const [row2, f2] = await pool.query(
//         `SELECT doctorId FROM treatment WHERE treatmentId = ?`,
//         row[0].treatmentId
//       );

//       if (row1[0].status === "อนุมัติรับยา") {
//         res.send("Cannot send");
//       } else if (row1[0].status !== "อนุมัติรับยา") {
//         const conn = await pool.getConnection();
//         await conn.beginTransaction();
//         try {
//           // อัพเดตไฟล์แรก
//           if (firstFile) {
//             await conn.query(
//               `UPDATE bloodResult SET picture = ?, date = ?, status = 'รออนุมัติผลเลือด' WHERE treatmentId = ?`,
//               [firstFilename, date, row[0].treatmentId]
//             );
//           }

//           // เพิ่มไฟล์ที่เหลือ
//           for (const file of otherFiles) {
//             const filename = "images/" + file.filename;
//             await conn.query(
//               `INSERT INTO bloodresult (picture, status, doctorId, treatmentId, date) VALUES (?, 'รออนุมัติผลเลือด', ?, ?, ?)`,
//               [filename, row2[0].doctorId, row[0].treatmentId, date]
//             );
//           }
//           await conn.commit();
//           res.send("Upload complete");
//         } catch (error) {
//           await conn.rollback();
//           console.log(error);
//           res.status(500).send("An error occurred");
//         } finally {
//           conn.release();
//         }
//       }
//     } catch (error) {
//       res.status(500).send("An error occurred");
//       console.error(error);
//     }
//   }
// );


//ผลเลือด ของพี่ ส่งแบบ array ทุกไฟล์ INSERT
router.post(
  "/uploadBloodResult",
  imgUpload.array("images", 10), // รองรับการอัพโหลดได้สูงสุด 10 ไฟล์
  async function (req, res, next) {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send("No files were uploaded.");
    }

    const files = req.files;
    // const date = moment(Date.now()).format();
    const date = moment().utcOffset("+07:00").format('YYYY-MM-DD HH:mm:ss');

    try {
      const [row, _] = await pool.query(
        `SELECT MAX(treatmentId) AS treatmentId FROM treatment JOIN patient ON treatment.HN=patient.HN WHERE treatment.IDcard = ?`,
        req.body.IDcard
      );
      console.log(row[0].treatmentId, "row[0].treatmentId");

      const [row_1, f_1] = await pool.query(
        `SELECT MAX(brId) AS brId FROM bloodresult WHERE treatmentId = ?`,
        row[0].treatmentId
      );
      console.log(row_1, "row_1");

      const [row1, f1] = await pool.query(
        `SELECT * FROM bloodresult WHERE brId = ?`,
        row_1[0].brId
      );

      const [row2, f2] = await pool.query(
        `SELECT doctorId FROM treatment WHERE treatmentId = ?`,
        row[0].treatmentId
      );

      // SELECT max(roundBrId) FROM bloodresult;
      const [row3, f3] = await pool.query(
        `SELECT max(roundBrId) AS maxRoundBrId FROM bloodresult`
      );

      if (row1[0].status === "อนุมัติรับยา") {
        res.send("Cannot send");
      } else if (row1[0].status !== "อนุมัติรับยา") {
        const conn = await pool.getConnection();
        await conn.beginTransaction();
        try {
          // เพิ่มไฟล์ทั้งหมด
          for (const file of files) {
            const filename = "images/" + file.filename;
            await conn.query(
              `INSERT INTO bloodresult (picture, status, doctorId, treatmentId, date, roundBrId) VALUES (?, 'รออนุมัติผลเลือด', ?, ?, ?, ?)`,
              [filename, row2[0].doctorId, row[0].treatmentId, date, row3[0].maxRoundBrId+1]
            );
          }
          await conn.commit();
          res.send("Upload complete");
        } catch (error) {
          await conn.rollback();
          console.log(error);
          res.status(500).send("An error occurred");
        } finally {
          conn.release();
        }
      }
    } catch (error) {
      res.status(500).send("An error occurred");
      console.error(error);
    }
  }
);








































































/////////////// new //////////////
function padWithLeadingZeros(num, totalLength) {
  return String(num).padStart(totalLength, "0");
}

router.post(`/newPatient`, async function (req, res, next) {
  //patient
  const HN = req.body.HN;
  const IDcard = req.body.IDcard;
  const prefix = req.body.prefix;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const birthDate = req.body.birthDate;
  const gender = req.body.gender;
  const phoneNumber = req.body.phoneNumber;

  //user
  const userName = IDcard;

  //history
  const nationality = req.body.nationality;
  const religious = req.body.religious;
  const marriageStatus = req.body.marriageStatus;
  const education = req.body.education;
  const occupation = req.body.occupation;
  const bloodGroup = req.body.bloodGroup;
  const IDcardAddress = req.body.IDcardAddress;
  const currentAddress = req.body.currentAddress;
  const contactAddress = req.body.contactAddress;
  const contactPerson = req.body.contactPerson;
  const relatedAs = req.body.relatedAs;
  const fatherName = req.body.fatherName;
  const motherName = req.body.motherName;
  const spouseName = req.body.spouseName;

  //diease
  const disease = req.body.disease;
  const usualMed = req.body.usualMed;
  const allergy = req.body.allergy;
  const allergyHis = req.body.allergyHis;
  const otherTreatment = req.body.otherTreatment;

  //addictive
  const smoking = req.body.smoking;
  const smokingPeriod = req.body.smokingPeriod;
  const cigaretteNumber = req.body.cigaretteNumber;
  const cigaretteButt = req.body.cigaretteButt;
  const alcohol = req.body.alcohol;
  const alcoholGlass = req.body.alcoholGlass;
  const alcoholPeriod = req.body.alcoholPeriod;
  const typeAlcohol = req.body.typeAlcohol;
  const nut = req.body.nut;
  const nutPeriod = req.body.nutPeriod;

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    await conn.query(
      `insert into user (userName, type, firstName, lastName) values (?, 'patient', ?, ?)`,
      [userName, firstName, lastName]
    );
    await conn.query(
      `insert into patient (HN, IDcard, prefix, firstName, lastName, birthDate, gender, phoneNumber, allergy) values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        HN,
        IDcard,
        prefix,
        firstName,
        lastName,
        birthDate,
        gender,
        phoneNumber,
        allergyHis,
      ]
    );
    await conn.query(
      `insert into diseases (disease, usualMed, otherTreatment, HN, IDcard) values (?, ?, ?, ?, ?)`,
      [disease, usualMed, otherTreatment, HN, IDcard]
    );
    if (allergyHis == "แพ้") {
      await conn.query(
        `insert into allergy (allergyDetail, HN, IDcard) values (?, ?, ?)`,
        [allergy, HN, IDcard]
      );
    } else if (allergyHis == "ไม่เคยแพ้") {
      await conn.query(
        `insert into allergy (allergyDetail, HN, IDcard) values (?, ?, ?)`,
        ["ไม่มีประวัติการแพ้", HN, IDcard]
      );
    }
    await conn.query(
      `insert into addictive (smoking, alcohol, nut, HN, IDcard) values (?, ?, ?, ?, ?)`,
      [smoking, alcohol, nut, HN, IDcard]
    );
    if (smoking == "สูบ" || smoking == "เคยสูบ") {
      await conn.query(
        `update addictive set smokingPeriod = ?, cigaretteNumber = ?, cigaretteButt = ? where addictiveId = last_insert_id()`,
        [Number(smokingPeriod), Number(cigaretteNumber), cigaretteButt]
      );
    }
    if (alcohol == "ดื่ม") {
      await conn.query(
        `update addictive set alcoholGlass = ?, alcoholPeriod = ?, typeAlcohol = ? where addictiveId = last_insert_id()`,
        [Number(alcoholGlass), Number(alcoholPeriod), typeAlcohol]
      );
    }
    if (nut == "เคย") {
      await conn.query(
        `update addictive set nutPeriod = ? where addictiveId = last_insert_id()`,
        Number(nutPeriod)
      );
    }

    await conn.query(
      `insert into history (nationality, religious, marriageStatus, education, occupation, bloodGroup, IDcardAddress, currentAddress, contactAddress, contactPerson, relatedAs, fatherName, motherName, spouseName, HN, IDcard) 
        values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nationality,
        religious,
        marriageStatus,
        education,
        occupation,
        bloodGroup,
        IDcardAddress,
        currentAddress,
        contactAddress,
        contactPerson,
        relatedAs,
        fatherName,
        motherName,
        spouseName,
        HN,
        IDcard,
      ]
    );
    conn.commit();
    res.send("success");
  } catch (error) {
    conn.rollback();
    console.log(error);
  } finally {
    conn.release();
  }
});

router.put(`/updatePatientInfo`, async function (req, res, next) {
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const birthDate = req.body.birthDate;
  const phoneNumber = req.body.phoneNumber;
  const IDcard = req.body.IDcard;
  const gender = req.body.gender;
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    await conn.query(
      `update patient set firstName = ?, lastName = ?, phoneNumber = ?, gender = ?`,
      [firstName, lastName, phoneNumber, gender]
    );
    conn.commit();
  } catch (error) {
    conn.rollback();
  } finally {
    conn.release();
  }
});

// ING ADD ING EDIT ING COMMENT THIS

// router.get(`/Allpatient`, async function (req, res, next) {
//   let data = new Array();
//   let cancer = new Array();
//   try {
//     const [rows, fs] = await pool.query(
//       `select max(brId) as brId, patient.HN from bloodresult join treatment on treatment.treatmentId=bloodresult.treatmentId join patient on treatment.HN=patient.HN group by treatment.treatmentId`
//     );
//     for (let i = 0; i < rows.length; i++) {
//       const [row, _] = await pool.query(
//         `select * from treatment join patient on patient.HN=treatment.HN join bloodresult on treatment.treatmentId=bloodresult.treatmentId where brId = ?`,
//         [rows[i].brId]
//       );
//       //รวม cancer ทุกคน ทุกอันของแต่ละคน
//       const [row1, f1] = await pool.query(
//         `select * from patient join cancer_patient on patient.HN=cancer_patient.HN join cancer on cancer.cancerId=cancer_patient.cancerId join treatment on treatment.HN=patient.HN join bloodresult on treatment.treatmentId=bloodresult.treatmentId where brId = ?`,
//         rows[i].brId
//       );
//       for (j = 0; j < row1.length; j++) {
//         cancer.push(row1[j]);
//       }
//       row[0].cancer = cancer;
//       data.push(row[0]);
//     }
//     res.json(data);
//   } catch (error) {
//     console.log(error);
//   }
// });

router.get(`/Allpatient`, async function (req, res, next) {
  let data = new Array();
  let cancer = new Array();
  try {
    const [rows, fs] = await pool.query(
      `select max(brId) as brId, patient.HN from bloodresult join treatment on treatment.treatmentId=bloodresult.treatmentId join patient on treatment.HN=patient.HN group by treatment.treatmentId`
    );
    for (let i = 0; i < rows.length; i++) {
      const [row, _] = await pool.query(
        `select * from treatment join patient on patient.HN=treatment.HN join bloodresult on treatment.treatmentId=bloodresult.treatmentId where brId = ?`,
        [rows[i].brId]
      );
      
      // สร้างตัวแปร cancer ในแต่ละรอบ และกรองให้ตรงกับ HN ของ row[0]
      let cancerForCurrentPatient = new Array();
      
      const [row1, f1] = await pool.query(
        `select * from patient join cancer_patient on patient.HN=cancer_patient.HN join cancer on cancer.cancerId=cancer_patient.cancerId join treatment on treatment.HN=patient.HN join bloodresult on treatment.treatmentId=bloodresult.treatmentId where brId = ?`,
        rows[i].brId
      );
      
      // กรองข้อมูลใน row1 ที่มี HN ตรงกับ row[0].HN
      for (let j = 0; j < row1.length; j++) {
        if (row1[j].HN === row[0].HN) {
          cancerForCurrentPatient.push(row1[j]);
        }
      }

      // ใส่ข้อมูล cancer ที่กรองแล้วเข้าไปใน row[0]
      row[0].cancer = cancerForCurrentPatient;

      // เพิ่มข้อมูล row[0] ลงใน data
      data.push(row[0]);
    }

    res.json(data);
  } catch (error) {
    console.log(error);
  }
});


router.get("/patient/:HN/:treatmentId", async function (req, res, next) {
  const HN = req.params.HN;
  const treatmentId = req.params.treatmentId;
  let cancer = new Array();
  try {
    const [rows, _] = await pool.query(
      "SELECT patient.*, treatment.*, bloodresult.*, allergy.*, user.UserIdLine, formula.formulaName FROM patient JOIN treatment ON patient.HN = treatment.HN JOIN bloodresult ON treatment.treatmentId = bloodresult.treatmentId LEFT JOIN allergy ON patient.HN = allergy.HN JOIN user ON patient.IDcard = user.userName JOIN formula ON treatment.formulaId = formula.formulaId WHERE patient.HN = ? AND treatment.treatmentId = ?",
      [HN, treatmentId]
    );
    // get all cancer of 1 user
    // const [row1, f1] = await pool.query(
    //   `select * from patient join cancer_patient on patient.HN=cancer_patient.HN join cancer on cancer.cancerId=cancer_patient.cancerId join treatment on treatment.HN=patient.HN join bloodresult on treatment.treatmentId=bloodresult.treatmentId where treatment.HN = ?`,
    //   HN
    // );
    const [row1, f1] = await pool.query(
      `SELECT patient.HN, patient.prefix, patient.firstName, patient.lastName, patient.birthDate, patient.phoneNumber, 
        patient.IDcard AS patient_IDcard, patient.gender, patient.doctorId AS patient_doctorId, patient.allergy, 
        MAX(cancer_patient.cancerId) AS cancer_patient_cancerId, MAX(cancer_patient.cancerState) AS cancerState, 
        MAX(cancer.cancerId) AS cancer_cancerId, cancer.cancerType AS cancerType, 
        MAX(treatment.treatmentId) AS treatmentId, MAX(treatment.formulaId) AS formulaId, 
        MAX(treatment.treatmentStatus) AS treatmentStatus, 
        MAX(bloodresult.brId) AS brId, MAX(bloodresult.date) AS date, 
        MAX(bloodresult.suggestion) AS suggestion, MAX(bloodresult.status) AS status
        FROM patient 
        JOIN cancer_patient ON patient.HN = cancer_patient.HN 
        JOIN cancer ON cancer.cancerId = cancer_patient.cancerId 
        JOIN treatment ON treatment.HN = patient.HN 
        JOIN bloodresult ON treatment.treatmentId = bloodresult.treatmentId 
        WHERE treatment.HN = ? 
        GROUP BY cancer.cancerType;
        `,
      HN
    );
    for (j = 0; j < row1.length; j++) {
      cancer.push(row1[j]);
    }
    rows[0].cancer = cancer;
    res.json(rows);
  } catch (error) {
    console.log(error);
  }
});
// ING ADD ING EDIT 
// router.get("/patient/:HN/:treatmentId", async function (req, res, next) {
//   const HN = req.params.HN;
//   const treatmentId = req.params.treatmentId;

//   try {
//     // ดึงข้อมูลหลักของ patient, treatment, bloodresult, allergy, และ user
//     const [rows, _] = await pool.query(
//       `SELECT patient.*, treatment.*, bloodresult.*, allergy.*, user.UserIdLine
//        FROM patient
//        JOIN treatment ON patient.HN = treatment.HN
//        JOIN bloodresult ON treatment.treatmentId = bloodresult.treatmentId
//        LEFT JOIN allergy ON patient.HN = allergy.HN
//        JOIN user ON patient.IDcard = user.userName
//        WHERE patient.HN = ? AND treatment.treatmentId = ?`,
//       [HN, treatmentId]
//     );

//     if (rows.length === 0) {
//       return res.status(404).json({ error: "Patient not found" });
//     }

//     // สร้างตัวแปร cancer เฉพาะสำหรับ HN ปัจจุบัน
//     let cancerForCurrentPatient = [];

//     // ดึงข้อมูล cancer ทั้งหมดที่เกี่ยวข้องกับผู้ป่วย
//     const [row1, f1] = await pool.query(
//       `SELECT *
//        FROM patient
//        JOIN cancer_patient ON patient.HN = cancer_patient.HN
//        JOIN cancer ON cancer.cancerId = cancer_patient.cancerId
//        JOIN treatment ON treatment.HN = patient.HN
//        JOIN bloodresult ON treatment.treatmentId = bloodresult.treatmentId
//        WHERE treatment.HN = ?`,
//       [HN]
//     );

//     // กรองข้อมูล cancer ที่มี HN ตรงกับ rows[0].HN
//     for (let j = 0; j < row1.length; j++) {
//       if (row1[j].HN === rows[0].HN) {
//         cancerForCurrentPatient.push(row1[j]);
//       }
//     }

//     // ใส่ข้อมูล cancer ที่กรองแล้วเข้าไปใน rows[0]
//     rows[0].cancer = cancerForCurrentPatient;

//     res.json(rows);
//   } catch (error) {
//     console.error("Error fetching patient data:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });




router.get(`/detailPatient/:HN`, async function (req, res, next) {
  const HN = req.params.HN;
  try {
    const [row, f] = await pool.query(`select * from patient where HN = ?`, HN);
    res.json(row);
  } catch (error) {
    console.log(error);
  }
});

router.post(`/createTreatment`, async function (req, res, next) {
  const listCancer = req.body.listCancer;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const [row2, f2] = await pool.query(
    `select * from patient where firstName = ? and lastName = ?`,
    [firstName, lastName]
  );
  const formulaName = req.body.formula;
  const doctor = req.body.doctor.split(" ");
  const doctor_firstName = doctor[0];
  const doctor_lastName = doctor[1];
  const [row, _] = await pool.query(
    `select doctorId from doctor join user on userId=doctorId where firstName = ? and lastName = ?`,
    [doctor_firstName, doctor_lastName]
  );
  const [row1, f1] = await pool.query(
    `select formulaId from formula where formulaName = ?`,
    formulaName
  );
  let cancer = new Array();
  for (let i = 0; i < listCancer.length; i++) {
    const [row4, f4] = await pool.query(
      `select cancerId from cancer where cancerType = ?`,
      listCancer[i].cancerType
    );
    cancer.push(row4[0]);
  }

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    if (row2.length == 0) {
      res.send("no");
    } else {
      for (let i = 0; i < cancer.length; i++) {
        await conn.query(
          `insert into cancer_patient (cancerId, IDcard, HN, cancerState) values (?, ?, ?, ?)`,
          [
            cancer[i].cancerId,
            row2[0].IDcard,
            row2[0].HN,
            listCancer[i].cancerState,
          ]
        );
      }
      await conn.query(
        `insert into treatment (IDcard, HN, formulaId, doctorId, treatmentStatus) values (?, ?, ?, ?, 'อยู่ระหว่างการรักษา')`,
        [row2[0].IDcard, row2[0].HN, row1[0].formulaId, row[0].doctorId]
      );
      await conn.query(
        `insert into bloodresult (status, doctorId, treatmentId) values ('ยังไม่ส่งผลเลือด', ?, last_insert_id())`,
        row[0].doctorId
      );
      await conn.query(`update patient set doctorId = ? where HN = ?`, [
        row[0].doctorId,
        row2[0].HN,
      ]);
      conn.commit();
      const [row4, f4] = await conn.query(
        `select max(treatmentId) as treatmentId from treatment join patient on treatment.HN=patient.HN where patient.firstName = ? and lastName = ?`,
        [firstName, lastName]
      );
      const [row3, f3] = await conn.query(
        `select * from patient join treatment on patient.HN=treatment.HN where treatment.treatmentId = ?`,
        row4[0].treatmentId
      );
      res.json(row3);
    }
  } catch (error) {
    conn.rollback();
    console.log(error);
  } finally {
    conn.release();
  }
});

router.get(`/treatment/:treatmentId`, async function (req, res, next) {
  const treatmentId = req.params.treatmentId;
  try {
    const [row, f] = await pool.query(
      `select * from treatment join formula on formula.formulaId=treatment.formulaId where treatmentId = ? order by treatmentId desc`,
      treatmentId
    );
    res.json(row[0]);
  } catch (error) {
    console.log(error);
  }
});

router.get(
  `/currentTreatment/:HN/:treatmentId`,
  async function (req, res, next) {
    const HN = req.params.HN;
    const treatmentId = req.params.treatmentId;
    try {
      const [row, f] = await pool.query(
        `select * from treatment join formula on formula.formulaId=treatment.formulaId where HN = ? and treatmentId = ?`,
        [HN, treatmentId]
      );
      res.json(row);
    } catch (error) {
      console.log(error);
    }
  }
);

router.post(`/addDisease`, async function (req, res, next) {
  const HN = req.body.HN;
  const disease = req.body.disease;
  const usualMed = req.body.usualMed;
  const allergyMed = req.body.allergyMed;
  const otherTrearment = this.otherTrearment;
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    await conn.query(
      `insert into diseases (disease, usualMed, allergyMed, otherTreatment, HN) values (?, ?, ?, ?, ?)`,
      [disease, usualMed, allergyMed, otherTrearment, HN]
    );
    conn.commit();
    const [row, f] = await conn.query(
      `select * from diseases where HN = ?`,
      HN
    );
    res.json(row);
  } catch (error) {
    conn.rollback();
    console.log(error);
  } finally {
    conn.release();
  }
});

router.get(`/getDiseases/:HN`, async function (req, res, next) {
  const HN = req.params.HN;
  try {
    const [row, f] = await pool.query(
      `select * from diseases where HN = ?`,
      HN
    );
    res.json(row);
  } catch (error) {
    console.log(error);
  }
});

router.post("/selectedPatient", async function (req, res, next) {
  const selected = req.body.selected;
  let data = new Array();
  let cancer = new Array();

  try {
    const [rows, fs] = await pool.query(
      `select max(brId) as brId, patient.HN from bloodresult join treatment on treatment.treatmentId=bloodresult.treatmentId join patient on treatment.HN=patient.HN group by treatment.treatmentId`
    );
    for (let i = 0; i < rows.length; i++) {
      const [row, _] = await pool.query(
        `select * from treatment join patient on patient.HN=treatment.HN join bloodresult on treatment.treatmentId=bloodresult.treatmentId where patient.HN like ? or patient.firstName like ? or patient.lastName like ?`,
        [`%${selected}%`, `%${selected}%`, `%${selected}%`]
      );
      const [row1, f1] = await pool.query(
        `select * from patient join cancer_patient on patient.HN=cancer_patient.HN join cancer on cancer.cancerId=cancer_patient.cancerId join treatment on treatment.HN=patient.HN join bloodresult on treatment.treatmentId=bloodresult.treatmentId where brId = ?`,
        rows[i].brId
      );
      for (j = 0; j < row1.length; j++) {
        cancer.push(row1[j]);
      }
      if (row.length != 0) {
        row[i].cancer = cancer;
      }
      data.push(row);
    }
    /*if (selected == '') {
            for (let i = 0; i < rows.length; i++) {
                const [row, _] = await pool.query(`select * from treatment join patient on patient.HN=treatment.HN join bloodresult on treatment.treatmentId=bloodresult.treatmentId where brId = ?`, [rows[i].brId])
                const [row1, f1] = await pool.query(`select * from patient join cancer_patient on patient.HN=cancer_patient.HN join cancer on cancer.cancerId=cancer_patient.cancerId join treatment on treatment.HN=patient.HN join bloodresult on treatment.treatmentId=bloodresult.treatmentId where brId = ?`, rows[i].brId)
                for (j = 0; j < row1.length; j++) {
                    cancer.push(row1[j])
                }
                row[i].cancer = cancer
                data.push(row)
            }
        }*/
    if (data.length != 0) {
      res.json(data);
    } else {
      res.send("ไม่พบรายชื่อที่ค้นหา");
    }
  } catch (error) {
    console.log(error);
  }
});

router.post(
  `/addQRcode`,
  imgUpload.single("image"),
  async function (req, res, next) {
    let filename = "images/" + req.file.filename;
    let formulaId = req.body.formulaId;
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      await conn.query(`update guideBook set QRcode = ? where formulaId = ?`, [
        filename,
        formulaId,
      ]);
      conn.commit();
      const [row, f] = await conn.query(
        `select * from formula left join guideBook on formula.formulaId=guideBook.formulaId`
      );
      res.json(row);
    } catch (error) {
      conn.rollback();
      console.log(error);
    } finally {
      conn.release();
    }
  }
);

router.post(
  `/savePDF`,
  imgUpload.single("file"),
  async function (req, res, next) {
    let filename = "images/" + req.file.filename;
    let formulaId = req.body.formulaId;
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      await conn.query(`update guideBook set pdf = ? where formulaId = ?`, [
        filename,
        formulaId,
      ]);
      conn.commit();
      const [row, f] = await conn.query(
        `select * from formula left join guideBook on formula.formulaId=guideBook.formulaId`
      );
      res.json(row);
    } catch (error) {
      conn.rollback();
      console.log(error);
    } finally {
      conn.release();
    }
  }
);

router.post(`/searchGuideBook`, async function (req, res, next) {
  try {
    const [row, f] = await pool.query(
      `select * from formula left join guideBook on formula.formulaId=guideBook.formulaId where formulaName like ?`,
      [`%${req.body.search}%`]
    );
    if (row.length != 0) {
      res.json(row);
    } else {
      res.send("ไม่พบสูตรยาที่ค้นหา");
    }
  } catch (error) {
    console.log(error);
  }
});

router.post("/sortGuideBook", async function (req, res, next) {
  let data = new Array();
  const sortFormula = req.body.sortFormula;
  try {
    if (sortFormula == "1") {
      const [rows, _] = await pool.query(
        `select * from formula left join guideBook on formula.formulaId=guideBook.formulaId order by formula.formulaId asc`
      );
      data.push(rows);
    } else if (sortFormula == "2") {
      const [rows1, _] = await pool.query(
        `select * from formula left join guideBook on formula.formulaId=guideBook.formulaId order by formula.formulaId desc`
      );
      data.push(rows1);
    } else if (sortFormula == "3") {
      const [rows2, _] = await pool.query(
        `select * from formula left join guideBook on formula.formulaId=guideBook.formulaId order by formulaName asc`
      );
      data.push(rows2);
    } else if (sortFormula == "4") {
      const [rows3, _] = await pool.query(
        `select * from formula left join guideBook on formula.formulaId=guideBook.formulaId order by formulaName desc`
      );
      data.push(rows3);
    }
    res.json(data);
  } catch (error) {
    console.log(error);
  }
});

//นงเพิ่ม ดึงQRคู่มือแสดงที่ไลน์
router.get(`/PatientManual/:HN`, async (req, res) => {
  let HN = req.params.HN; 
  try {
    // Query เพื่อดึง formulaId ที่เกี่ยวข้องกับผู้ป่วยจาก HN
    const [formulaRows] = await pool.query(
      `SELECT formulaId FROM treatment WHERE HN = ?`,
      [HN]
    );
    // ตรวจสอบว่าผู้ป่วยมีการใช้สูตรยาหรือไม่
    if (formulaRows.length === 0) {
      return res.status(404).json({ message: "No treatment found for this patient" });
    }
    // ดึงข้อมูล pdf  จาก guidebook โดยใช้ formulaId ที่ได้จาก treatment
    const formulaId = formulaRows[0].formulaId; 
    
    const [guidebookRows] = await pool.query(
      `SELECT pdf FROM guidebook WHERE formulaId = ?`,
      [formulaId]
    );

    // ตรวจสอบว่ามีข้อมูลคู่มือหรือไม่
    if (guidebookRows.length === 0) {
      return res.status(404).json({ message: "No guidebook found for this formula" });
    }
    // ส่งข้อมูล QR code กลับไปที่ Frontend
    res.json({ pdf: guidebookRows[0].pdf });
    
  } catch (error) {
    console.error("Error fetching patient manual:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//นงเพิ่ม ดึง ชื่อสูตรยา แสดงที่ front-line
router.get(`/getFormulaName/:HN`, async (req, res) => {
  const HN = req.params.HN;
  try {
    // เชื่อมตาราง treatment และ formula ใช้ HN และ formulaId
    const [formulaNameRows] = await pool.query(
      `SELECT f.formulaName FROM treatment t JOIN formula f ON t.formulaId = f.formulaId WHERE t.HN = ?`,
      [HN]
    );
    if (formulaNameRows.length === 0) {
      return res.status(404).json({ message: "No formula found for this HN" });
    }
    res.json(formulaNameRows[0]);
  } catch (error) {
    console.error("Error fetching formula name:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


// ING ADD
router.get(`/check-hn/:newhn`, async function (req, res, next) {
  const newhn = req.params.newhn; // ดึงค่าจาก route parameter
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS count FROM patient WHERE HN = ?`,
      [newhn]
    );

    // ตรวจสอบผลลัพธ์
    const exists = rows[0].count > 0;

    // ส่งผลลัพธ์กลับไปในรูปแบบ JSON
    res.json({ exists });
  } catch (error) {
    console.error("Error checking HN:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DASHBOARD แดชบอร์ด

// กราฟ2
router.get('/age-groups', async (req, res) => {
  try {
      // Query ข้อมูลจากตาราง patient
      const [rows] = await pool.query(`
          SELECT 
              gender,
              FLOOR(DATEDIFF(CURDATE(), birthDate) / 365) AS age
          FROM patient;
      `);

      // จัดกลุ่มข้อมูลตามช่วงอายุและเพศ
      const ageGroups = {
          '0-18Male': 0,
          '0-18Female': 0,
          '19-35Male': 0,
          '19-35Female': 0,
          '36-50Male': 0,
          '36-50Female': 0,
          '51-65Male': 0,
          '51-65Female': 0,
          '65+Male': 0,
          '65+Female': 0
      };

      rows.forEach(row => {
          const { gender, age } = row;
          if (age <= 18) {
              gender === 'Male'
                  ? ageGroups['0-18Male']++
                  : ageGroups['0-18Female']++;
          } else if (age <= 35) {
              gender === 'Male'
                  ? ageGroups['19-35Male']++
                  : ageGroups['19-35Female']++;
          } else if (age <= 50) {
              gender === 'Male'
                  ? ageGroups['36-50Male']++
                  : ageGroups['36-50Female']++;
          } else if (age <= 65) {
              gender === 'Male'
                  ? ageGroups['51-65Male']++
                  : ageGroups['51-65Female']++;
          } else {
              gender === 'Male'
                  ? ageGroups['65+Male']++
                  : ageGroups['65+Female']++;
          }
      });
      res.json(ageGroups);
      
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error' });
  }
});


// กราฟ 1
// router.get('/cancer-summary', async (req, res) => {
//   try {
//       const [rows] = await pool.query(`
//           SELECT c.cancerType, g.gender, COUNT(p.IDcard) AS total FROM (SELECT 'ชาย' AS gender UNION SELECT 'หญิง') g CROSS JOIN cancer c LEFT JOIN cancer_patient cp ON c.cancerId = cp.cancerId LEFT JOIN patient p ON cp.IDcard = p.IDcard AND p.gender = g.gender GROUP BY c.cancerType, g.gender ORDER BY c.cancerType, g.gender;
//       `);

//       res.json(rows);

//   } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'Error' });
//   }
// });
// 


// ทดวันที่ 25/2/68
// router.get('/cancer-summary', async (req, res) => {
//   try {

//       const [rows] = await pool.query(`
//           SELECT 
//               c.cancerType,
//               g.gender,
//               COUNT(p.IDcard) AS total
//           FROM 
//               (SELECT 'ชาย' AS gender UNION SELECT 'หญิง') g
//           CROSS JOIN 
//               cancer c
//           LEFT JOIN 
//               cancer_patient cp ON c.cancerId = cp.cancerId
//           LEFT JOIN 
//               patient p ON cp.IDcard = p.IDcard AND p.gender = g.gender
//           GROUP BY 
//               c.cancerType, g.gender
//           ORDER BY 
//               c.cancerType, g.gender;
//       `);

//       // แปลงข้อมูลเป็น JSON ในรูปแบบที่ต้องการ
//       const result = {};
//       rows.forEach(row => {
//           const key = `${row.cancerType} ${row.gender}`;
//           result[key] = row.total;
//       });

//       res.json(result);

//   } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'Error' });
//   }
// });

router.get('/cancer-summary', async (req, res) => {
  try {
      
      const { cancerState } = req.query;

      let cancerStateCondition = '';

      if (cancerState) {
          cancerStateCondition = `AND cp.cancerState = ?`;
      }

      const [rows] = await pool.query(`
          SELECT c.cancerType, g.gender, COUNT(p.IDcard) AS total, 
          GROUP_CONCAT(cp.cancerState SEPARATOR '*') AS cancerState 
          FROM (SELECT 'ชาย' AS gender UNION SELECT 'หญิง') g 
          CROSS JOIN cancer c 
          LEFT JOIN cancer_patient cp ON c.cancerId = cp.cancerId 
          LEFT JOIN patient p ON cp.IDcard = p.IDcard AND p.gender = g.gender 
          WHERE 1=1 ${cancerStateCondition} 
          GROUP BY c.cancerType, g.gender 
          ORDER BY c.cancerType, g.gender;
        `);


      // แปลงข้อมูลเป็น JSON ในรูปแบบที่ต้องการ
      const result = {};
      rows.forEach(row => {
          const key = `${row.cancerType} ${row.gender}`;
          result[key] = row.total;
      });

      res.json(result);

  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error' });
  }
});


// CancerState /cancer-summary
router.get('/cancerstate-cancer-summary', async (req, res) => {
  try {
      // รับค่า cancerState จากพารามิเตอร์ใน URL
      const { cancerState } = req.query; // ตัวอย่างเช่น /cancerstate-cancer-summary?cancerState=1,2,3

      // สร้างเงื่อนไขในการกรอง
      let cancerStateCondition = '';
      let queryParams = [];
      
      if (cancerState) {
          // แปลงค่าจากพารามิเตอร์ที่คั่นด้วย comma เป็น array
          const cancerStateArray = cancerState.split(',').map(state => state.trim());
          cancerStateCondition = `AND cp.cancerState IN (?)`; // ใช้ IN สำหรับกรองหลายค่า
          queryParams.push(cancerStateArray); // เพิ่ม array ของ cancerState ไปใน queryParams
      }

      // ใช้ prepared statement เพื่อป้องกัน SQL injection
      const query = `
          SELECT c.cancerType, g.gender, COUNT(p.IDcard) AS total, 
                 GROUP_CONCAT(cp.cancerState SEPARATOR '*') AS cancerState 
          FROM (SELECT 'ชาย' AS gender UNION SELECT 'หญิง') g 
          CROSS JOIN cancer c 
          LEFT JOIN cancer_patient cp ON c.cancerId = cp.cancerId 
          LEFT JOIN patient p ON cp.IDcard = p.IDcard AND p.gender = g.gender 
          WHERE 1=1 ${cancerStateCondition} 
          GROUP BY c.cancerType, g.gender 
          ORDER BY c.cancerType, g.gender;
      `;

      // ทำการ query โดยส่งพารามิเตอร์สำหรับ cancerState หากมี
      const [rows] = await pool.query(query, queryParams.length ? queryParams : []);

      // แปลงข้อมูลเป็น JSON ในรูปแบบที่ต้องการ
      const result = {};
      rows.forEach(row => {
          const key = `${row.cancerType} ${row.gender}`;
          result[key] = row.total;
      });

      res.json(result);

  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error' });
  }
});











// DASHBOARD FEEDBACK
// router.get('/feedback-summary', async (req, res) => {
//   try {

//       const [rows] = await pool.query(`
//           SELECT appointment.HN, GROUP_CONCAT(feedback.patientSideEffect SEPARATOR '*') AS patientSideEffects, appointment.appointId, cancer_patient.cancerId, GROUP_CONCAT(cancer.cancerType SEPARATOR '*') AS cancerTypes FROM feedback JOIN appointment ON appointment.appointId = feedback.appointId JOIN cancer_patient ON cancer_patient.HN = appointment.HN JOIN cancer ON cancer.cancerId = cancer_patient.cancerId GROUP BY appointment.HN;
//       `);

//       const result = rows.map(row => ({
//         HN: row.HN,
//         appointId: row.appointId,
//         cancerId: row.cancerId,
//         patientSideEffects: row.patientSideEffects
//           ? row.patientSideEffects.split('*')
//               .flatMap(effect => effect.split(','))
//               .map(effect => effect.trim())
//           : [],
//         cancerTypes: row.cancerTypes
//           ? [...new Set(row.cancerTypes.split('*').map(type => type.trim()))]
//           : []
//       }));
  
//       res.json(result);

//   } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'Error' });
//   }
// });


// ทดวันที่ 25/2/68
// router.get('/feedback-summary', async (req, res) => { 
//   try {
//     const [rows] = await pool.query(`
//       SELECT 
//         appointment.HN, 
//         GROUP_CONCAT(feedback.patientSideEffect SEPARATOR '*') AS patientSideEffects, 
//         appointment.appointId, 
//         cancer_patient.cancerId, 
//         GROUP_CONCAT(cancer.cancerType SEPARATOR '*') AS cancerTypes
//       FROM 
//         feedback 
//       JOIN 
//         appointment ON appointment.appointId = feedback.appointId 
//       JOIN 
//         cancer_patient ON cancer_patient.HN = appointment.HN 
//       JOIN 
//         cancer ON cancer.cancerId = cancer_patient.cancerId 
//       GROUP BY 
//         appointment.HN;
//     `);

//     // รายการอาการทั้งหมด
//     const sideEffectsList = [
//       "กดการทำงานของไขกระดูก หรือภูมิต้านทานต่ำ",
//       "เยื่อบุปากอักเสบ",
//       "ผมร่วง/ ผมบาง",
//       "อ่อนเพลีย / ครั่นเนื้อครั่นตัว",
//       "ผิวหนังสีเข้มขึ้น",
//       "ใจสั่น / หอบเหนื่อยง่าย",
//       "กระเพาะปัสสาวะอักเสบ"
//     ];

//     // รายการประเภทมะเร็งทั้งหมด
//     const cancerTypesList = [
//       "มะเร็งปอด",
//       "มะเร็งกระเพาะอาหาร",
//       "มะเร็งลำไส้ใหญ่",
//       "มะเร็งตับ",
//       "มะเร็งตับอ่อน",
//       "มะเร็งต่อมไทรอยด์",
//       "มะเร็งไต",
//       "มะเร็งกระเพาะปัสสาวะ",
//       "มะเร็งอัณฑะ",
//       "มะเร็งต่อมลูกหมาก",
//       "มะเร็งถุงน้ำดี",
//       "มะเร็งมดลูก",
//       "มะเร็งเต้านม",
//       "มะเร็งรังไข่"
//     ];

//     const result = {};

//     rows.forEach(row => {
//       const patientSideEffects = row.patientSideEffects ? row.patientSideEffects.split('*').flatMap(effect => effect.split(',')).map(effect => effect.trim()) : [];
//       const cancerTypes = row.cancerTypes ? [...new Set(row.cancerTypes.split('*').map(type => type.trim()))] : [];
      
//       const effectCounts = sideEffectsList.reduce((acc, effect) => {
//         acc[effect] = patientSideEffects.filter(sideEffect => sideEffect === effect).length;
//         return acc;
//       }, {});

//       cancerTypes.forEach(cancerType => {
//         if (!result[cancerType]) {
//           result[cancerType] = sideEffectsList.reduce((acc, effect) => {
//             acc[effect] = 0;
//             return acc;
//           }, {});
//           result[cancerType].patients = new Set();
//         }

//         result[cancerType].patients.add(row.HN);

//         sideEffectsList.forEach(effect => {
//           result[cancerType][effect] += effectCounts[effect];
//         });
//       });
//     });

//     // เติมข้อมูลสำหรับมะเร็งที่ไม่มีข้อมูล
//     cancerTypesList.forEach(cancerType => {
//       if (!result[cancerType]) {
//         result[cancerType] = sideEffectsList.reduce((acc, effect) => {
//           acc[effect] = 0;
//           return acc;
//         }, {});
//         result[cancerType].patients = new Set();
//       }
//     });

//     // คำนวณอัตราส่วนในแต่ละอาการ
//     Object.keys(result).forEach(cancerType => {
//       const totalSideEffects = sideEffectsList.reduce((sum, effect) => sum + result[cancerType][effect], 0);
//       const totalPatients = result[cancerType].patients.size;

//       sideEffectsList.forEach(effect => {
//         if (totalSideEffects > 0) {
//           result[cancerType][effect] = (result[cancerType][effect] / totalSideEffects) * 100;
//         }
//       });

//       delete result[cancerType].patients;
//     });

//     res.json(result);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Error' });
//   }
// });
router.get('/feedback-summary', async (req, res) => { 
  try {
    const [rows] = await pool.query(`
      SELECT appointment.HN, GROUP_CONCAT(feedback.patientSideEffect SEPARATOR '*') AS patientSideEffects, appointment.appointId, cancer_patient.cancerId, GROUP_CONCAT(cancer.cancerType SEPARATOR '*') AS cancerTypes, GROUP_CONCAT(cancer_patient.cancerState SEPARATOR '*') AS cancerState FROM feedback JOIN appointment ON appointment.appointId = feedback.appointId JOIN cancer_patient ON cancer_patient.HN = appointment.HN JOIN cancer ON cancer.cancerId = cancer_patient.cancerId GROUP BY appointment.HN;
    `);

    // รายการอาการทั้งหมด
    const sideEffectsList = [
      "กดการทำงานของไขกระดูก หรือภูมิต้านทานต่ำ",
      "เยื่อบุปากอักเสบ",
      "ผมร่วง/ ผมบาง",
      "อ่อนเพลีย / ครั่นเนื้อครั่นตัว",
      "ผิวหนังสีเข้มขึ้น",
      "ใจสั่น / หอบเหนื่อยง่าย",
      "กระเพาะปัสสาวะอักเสบ"
    ];

    // รายการประเภทมะเร็งทั้งหมด
    const cancerTypesList = [
      "มะเร็งปอด",
      "มะเร็งกระเพาะอาหาร",
      "มะเร็งลำไส้ใหญ่",
      "มะเร็งตับ",
      "มะเร็งตับอ่อน",
      "มะเร็งต่อมไทรอยด์",
      "มะเร็งไต",
      "มะเร็งกระเพาะปัสสาวะ",
      "มะเร็งอัณฑะ",
      "มะเร็งต่อมลูกหมาก",
      "มะเร็งถุงน้ำดี",
      "มะเร็งมดลูก",
      "มะเร็งเต้านม",
      "มะเร็งรังไข่"
    ];

    const result = {};

    rows.forEach(row => {
      const patientSideEffects = row.patientSideEffects ? row.patientSideEffects.split('*').flatMap(effect => effect.split(',')).map(effect => effect.trim()) : [];
      const cancerTypes = row.cancerTypes ? [...new Set(row.cancerTypes.split('*').map(type => type.trim()))] : [];
      
      const effectCounts = sideEffectsList.reduce((acc, effect) => {
        acc[effect] = patientSideEffects.filter(sideEffect => sideEffect === effect).length;
        return acc;
      }, {});

      cancerTypes.forEach(cancerType => {
        if (!result[cancerType]) {
          result[cancerType] = sideEffectsList.reduce((acc, effect) => {
            acc[effect] = 0;
            return acc;
          }, {});
          result[cancerType].patients = new Set();
        }

        result[cancerType].patients.add(row.HN);

        sideEffectsList.forEach(effect => {
          result[cancerType][effect] += effectCounts[effect];
        });
      });
    });

    // เติมข้อมูลสำหรับมะเร็งที่ไม่มีข้อมูล
    cancerTypesList.forEach(cancerType => {
      if (!result[cancerType]) {
        result[cancerType] = sideEffectsList.reduce((acc, effect) => {
          acc[effect] = 0;
          return acc;
        }, {});
        result[cancerType].patients = new Set();
      }
    });

    // คำนวณอัตราส่วนในแต่ละอาการ
    Object.keys(result).forEach(cancerType => {
      const totalSideEffects = sideEffectsList.reduce((sum, effect) => sum + result[cancerType][effect], 0);
      const totalPatients = result[cancerType].patients.size;

      sideEffectsList.forEach(effect => {
        if (totalSideEffects > 0) {
          result[cancerType][effect] = (result[cancerType][effect] / totalSideEffects) * 100;
        }
      });

      delete result[cancerType].patients;
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error' });
  }
});

router.get('/fomula-summary', async (req, res) => { 
  try {
    const [rows] = await pool.query(`
      SELECT appointment.HN, GROUP_CONCAT(feedback.patientSideEffect SEPARATOR '*') AS patientSideEffects, appointment.appointId, cancer_patient.cancerId, GROUP_CONCAT(cancer.cancerType SEPARATOR '*') AS cancerTypes, formula.formulaName FROM feedback JOIN appointment ON appointment.appointId = feedback.appointId JOIN cancer_patient ON cancer_patient.HN = appointment.HN JOIN cancer ON cancer.cancerId = cancer_patient.cancerId JOIN treatment ON treatment.HN = cancer_patient.HN JOIN formula ON formula.formulaId = treatment.formulaId GROUP BY appointment.HN, formula.formulaName;
    `);

    // รายการอาการทั้งหมด
    const sideEffectsList = [
      "กดการทำงานของไขกระดูก หรือภูมิต้านทานต่ำ",
      "เยื่อบุปากอักเสบ",
      "ผมร่วง/ ผมบาง",
      "อ่อนเพลีย / ครั่นเนื้อครั่นตัว",
      "ผิวหนังสีเข้มขึ้น",
      "ใจสั่น / หอบเหนื่อยง่าย",
      "กระเพาะปัสสาวะอักเสบ"
    ];

    // รายการ Fomula ทั้งหมด
    const formulaNamesList = [
      "AC",
      "FAC",
      "Cis CCRT Cervix",
      "Carbo CCRT Cervix",
      "5FU-Leucovorin",
      "Pac-Carbo"
    ];

    const result = {};

    rows.forEach(row => {
      const patientSideEffects = row.patientSideEffects ? row.patientSideEffects.split('*').flatMap(effect => effect.split(',')).map(effect => effect.trim()) : [];
      
      const effectCounts = sideEffectsList.reduce((acc, effect) => {
        acc[effect] = patientSideEffects.filter(sideEffect => sideEffect === effect).length;
        return acc;
      }, {});

      const formulaName = row.formulaName;
      
      if (!result[formulaName]) {
        result[formulaName] = sideEffectsList.reduce((acc, effect) => {
          acc[effect] = 0;
          return acc;
        }, {});
        result[formulaName].patients = new Set();
      }

      result[formulaName].patients.add(row.HN);

      sideEffectsList.forEach(effect => {
        result[formulaName][effect] += effectCounts[effect];
      });
    });

    // เติมข้อมูลสำหรับ formula ที่ไม่มีข้อมูล
    formulaNamesList.forEach(formulaName => {
      if (!result[formulaName]) {
        result[formulaName] = sideEffectsList.reduce((acc, effect) => {
          acc[effect] = 0;
          return acc;
        }, {});
        result[formulaName].patients = new Set();
      }
    });

    // คำนวณอัตราส่วนในแต่ละอาการ
    Object.keys(result).forEach(formulaName => {
      const totalSideEffects = sideEffectsList.reduce((sum, effect) => sum + result[formulaName][effect], 0);
      const totalPatients = result[formulaName].patients.size;

      sideEffectsList.forEach(effect => {
        if (totalSideEffects > 0) {
          result[formulaName][effect] = (result[formulaName][effect] / totalSideEffects) * 100;
        }
      });

      delete result[formulaName].patients;
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error' });
  }
});




// EXPORT ข้อมูล
// router.get("/export/csv", async (req, res) => {
//   try {
//     // รับ fields ที่ส่งมาจาก query parameters
//     const { fields } = req.query;

//     if (!fields || fields.length === 0) {
//       return res.status(400).json({ message: "กรุณาระบุ fields ที่ต้องการส่งออก" });
//     }

//     // แปลง fields จาก query string ให้เป็น array (รองรับหลาย fields)
//     const selectedFields = Array.isArray(fields) ? fields : [fields];

//     // ตรวจสอบว่า fields ที่เลือกตรงกับ column ใน database
//     const validFields = ["HN", "firstName", "lastName"]; // ระบุคอลัมน์ที่อนุญาต
//     const filteredFields = selectedFields.filter(field => validFields.includes(field));

//     if (filteredFields.length === 0) {
//       return res.status(400).json({ message: "fields ที่เลือกไม่ถูกต้อง" });
//     }

//     // สร้าง SQL สำหรับเลือกเฉพาะ fields ที่ต้องการ
//     const query = `SELECT ${filteredFields.join(", ")} FROM patient`;

//     // ดึงข้อมูลจาก database
//     const [rows] = await pool.query(query);

//     if (rows.length === 0) {
//       return res.status(404).json({ message: "No data found" });
//     }
//     console.log("rows:", rows);
//     // สร้าง CSV โดยใช้ json2csv
//     const json2csv = new Parser({ fields: filteredFields });
//     const csv = json2csv.parse(rows);

//     // ส่งไฟล์ CSV กลับไปยัง Frontend
//     res.header("Content-Type", "text/csv");
//     res.attachment("data_patient.csv");
//     res.send(csv);
//     console.log("csv:", csv);
//     console.log("json2csv:", json2csv);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: error.message });
//   }
// });



// EXPORT NEW!
router.get("/export/csv", async (req, res) => {
  try {
    const { fields } = req.query;

    if (!fields || fields.length === 0) {
      return res.status(400).json({ message: "กรุณาระบุ fields ที่ต้องการส่งออก" });
    }

    const selectedFields = Array.isArray(fields) ? fields : [fields];

    const processedFields = selectedFields.map(field => {
      if (field === "cancerType") {
        return "GROUP_CONCAT(DISTINCT cancer.cancerType SEPARATOR '/') AS cancerType";
      }
      if (field === "disease") {
        return "GROUP_CONCAT(DISTINCT diseases.disease SEPARATOR '/') AS disease";
      }
      return field;
    });


    if (selectedFields.length === 0) {
      return res.status(400).json({ message: "fields ที่เลือกไม่ถูกต้อง" });
    }

    const query = `SELECT ${processedFields.join(", ")} FROM  User
      LEFT JOIN cancer_patient ON User.userName = cancer_patient.IDcard
      LEFT JOIN cancer ON cancer.cancerId = cancer_patient.cancerId
      LEFT JOIN diseases ON User.userName = diseases.IDcard
      LEFT JOIN treatment ON User.userName = treatment.IDcard
      LEFT JOIN history ON User.userName = history.IDcard
      WHERE User.type = 'patient'
      GROUP BY treatment.HN;
    `;

    const [rows] = await pool.query(query);
    console.log("rows:", rows);
    console.log("query:", query);
    if (rows.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    const fieldsAfterAs = selectedFields.map(field => {
      // ใช้ regex เพื่อดึงคำหลัง "AS"
      const match = field.match(/AS\s+(\w+)/i);
      return match ? match[1] : field; // ถ้าพบ "AS" คืนค่าคำหลัง AS, ไม่พบคืนค่า field เดิม
    });


    const json2csv = new Parser({ fields: fieldsAfterAs });
    const csv = json2csv.parse(rows);
    console.log("selectedFields", selectedFields)
    // ส่งไฟล์ CSV กลับไปยัง Frontend
    res.header("Content-Type", "text/csv");
    res.attachment("data_patient.csv");
    res.send(csv);
    console.log("csv:", csv);
    console.log("json2csv:", json2csv);
    console.log("fieldsAfterAs", fieldsAfterAs)
    console.log("fields", fields)
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});























// IMPORT DATA
router.post("/import-csv", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;

  try {
    const data = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        data.push(row);
      })
      .on("end", async () => {
        // นำข้อมูลเข้าสู่ฐานข้อมูล
        const query = `
          INSERT INTO patient (HN, prefix, firstName, lastName, birthDate, phoneNumber, IDcard, gender, doctorId, allergy)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const conn = await pool.getConnection();
        try {
          await Promise.all(
            data.map((row) =>
              conn.query(query, [
                row.HN,
                row.prefix,
                row.firstName,
                row.lastName,
                row.birthDate,
                row.phoneNumber,
                row.IDcard,
                row.gender,
                row.doctorId,
                row.allergy,
              ])
            )
          );
          res.status(200).json({ message: "Data imported successfully!" });
        } catch (error) {
          console.error("Error inserting data:", error);
          res.status(500).json({ error: "Failed to insert data" });
        } finally {
          conn.release();
        }
        fs.unlinkSync(filePath); // ลบไฟล์หลังจากใช้งานเสร็จ
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process file" });
  }
});




// DASHBOARD NEW! กราฟน้ำหนัก
router.get(`/getWeight/:IDcard`, async function (req, res, next) {
  const { IDcard } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT numWeight FROM weight WHERE IDcard = ?`,
      [IDcard]
    );

    // ส่งผลลัพธ์กลับไปในรูปแบบ JSON
    res.json({ rows });
  } catch (error) {
    console.error("Error checking HN:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



// DASH BORD PIE CHART
router.get('/usersfeedback-summary', async (req, res) => { 
  try {
    const { userName } = req.query;

    if (!userName) {
      return res.status(400).json({ error: "Missing userName parameter" });
    }

    const [rows] = await pool.query(`
      SELECT appointment.HN, GROUP_CONCAT(feedback.patientSideEffect SEPARATOR '*') AS patientSideEffects
      FROM feedback 
      JOIN appointment ON appointment.appointId = feedback.appointId 
      JOIN treatment ON treatment.HN = appointment.HN 
      JOIN formula ON formula.formulaId = treatment.formulaId
      JOIN user ON user.userName = appointment.IDcard
      WHERE user.userName = ?
      GROUP BY appointment.HN;
    `, [userName]);

    // รายการอาการทั้งหมด
    const sideEffectsList = [
      "กดการทำงานของไขกระดูก หรือภูมิต้านทานต่ำ",
      "เยื่อบุปากอักเสบ",
      "ผมร่วง/ ผมบาง",
      "อ่อนเพลีย / ครั่นเนื้อครั่นตัว",
      "ผิวหนังสีเข้มขึ้น",
      "ใจสั่น / หอบเหนื่อยง่าย",
      "กระเพาะปัสสาวะอักเสบ"
    ];

    const totalEffectCounts = sideEffectsList.reduce((acc, effect) => {
      acc[effect] = 0; // Initialize the counts
      return acc;
    }, {});

    let totalSideEffects = 0;

    // รวมผลข้างเคียงทั้งหมดของผู้ป่วย
    rows.forEach(row => {
      const patientSideEffects = row.patientSideEffects 
        ? row.patientSideEffects.split('*').flatMap(effect => effect.split(',')).map(effect => effect.trim()) 
        : [];
      
      const effectCounts = sideEffectsList.reduce((acc, effect) => {
        acc[effect] = patientSideEffects.filter(sideEffect => sideEffect === effect).length;
        return acc;
      }, {});

      sideEffectsList.forEach(effect => {
        totalEffectCounts[effect] += effectCounts[effect];
        totalSideEffects += effectCounts[effect];
      });
    });

    // คำนวณอัตราส่วนของผลข้างเคียงทั้งหมด
    const result = {};
    sideEffectsList.forEach(effect => {
      if (totalSideEffects > 0) {
        result[effect] = (totalEffectCounts[effect] / totalSideEffects) * 100;
      } else {
        result[effect] = 0;
      }
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error' });
  }
});



exports.router = router;
