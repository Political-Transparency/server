import excel from "exceljs";
import {
  insertBillRow,
  insertRawKnessetMemberRow,
  insertVoteForVotesRow,
} from "./database.js";

const data = "Votes 2021-2023.xlsx";
const readData = async (path) => {
  try {
    console.log("Start Read Data");
    const workbook = new excel.Workbook();
    await workbook.xlsx.readFile(path);
    // Get the first worksheet
    return workbook.getWorksheet(1);
  } catch (error) {
    console.error("Failed to read files", error.message);
    throw error;
  }
};
export const billsScript = async function (row) {
  // Create an Excel workbook
  console.log("Start Bills Scripts ......");
  const id = row.getCell(3).value;
  const name = row.getCell(8).value;
  const knesset_num = row.getCell(5).value;
  const vote_id = row.getCell(1).value;

  const isNum = Number.isInteger(knesset_num) ? knesset_num : 25;

  if (name !== "NULL" && id !== "NULL" && vote_id !== "NULL") {
    try {
      await insertBillRow(id, name, isNum, vote_id);
    } catch (error) {
      console.error(`Error inserting row ${i - 1}:`, error);
      return;
    }
  }
};
async function votingScript(row) {
  // Create an Excel workbook
  console.log("Started Voting Script......");
  // Extract data from the Excel row
  const vote_id = row.getCell(1).value;
  const mk_id = row.getCell(10).value;
  const bill_id = row.getCell(3).value;
  const vote = row.getCell(12).value;
  if (bill_id !== null && mk_id !== "NULL" && vote !== "NULL") {
    try {
      await insertVoteForVotesRow(bill_id, vote_id, mk_id, vote);
    } catch (error) {
      console.error("Failed to add vote to the db", error.message);
    }
  }
}

const kmScript = async (row) => {
  const mk_id = row.getCell(10).value;
  const full_name = row.getCell(11).value;
  if (mk_id !== null && full_name != null)
    try {
      await insertRawKnessetMemberRow(mk_id, full_name);
    } catch (error) {
      console.error(`Failed to add knesset member to the database`);
    }
};
export const totalScript = async () => {
  const worksheet = await readData(data);
  try {
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      await billsScript(row);
      await votingScript(row);
      await kmScript(row);
    }
  } catch (error) {
    console.error("Error in totalScript:", error.message);
  }

  console.log("Data import completed.");
};
