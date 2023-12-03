import { Sequelize, where } from "sequelize";
import connection from "../config/connect.js";
import pool from "../config/connect.js";
import KnessetMember from "../models/KnessetMember.js";
import Bill from "../models/bill.js";
import VoteType from "../models/VoteType.js";
import { validate, voteStringToInt } from "../Utils/localUtils.js";

await connection.sync();
/**


/**
 * Insert a knesset member row with specific structure for the application needs into knesset_members table.
 * @param {*} memberID
 * @param {*} memberName
 * @param {*} isActive
 */
export const insertKnessetMemberRow = async (
  memberID,
  memberFirstName,
  memberLastName,
  isActive
) => {
  // Check if the memberID already exists in the database

  // Check if the memberID does not exist (result[0]["COUNT(*)"] === 0)
  memberFirstName = validate(memberFirstName);
  memberLastName = validate(memberLastName);
  const fullName = memberFirstName + " " + memberLastName;

  isActive = isActive === "true" ? 1 : 0;
  // Insert the new row into the database
  try {
    await KnessetMember.findOrCreate({
      where: { id: memberID },
      defaults: { is_active: isActive, full_name: fullName },
    });
  } catch (error) {
    console.error(`Error with inserting knesset_member ${error.message}`);
  }
};

/**
 * Main function to insert bills into the local mySql database
 * @param {*} billID
 * @param {*} billName
 * @param {*} knessetNum
 */

export const insertBillRow = async (billID, billName, knessetNum) => {
  try {
    const validName = validate(billName);
    await Bill.findOrCreate({
      where: { id: billID },
      defaults: { name: validName, knesset_num: knessetNum },
    });
  } catch (err) {
    console.error(`Error in insertBillRow: ${err.message}`);
    return err; // Reject the promise on error
  }
};

/**
 * Updating to the last vote of bill
 * @param {*} billID
 * @param {*} voteID
 */
export const updateVoteId = async (billID, voteID) => {
  try {
    await Bill.update(
      { vote_id: voteID }, // Corrected syntax here
      {
        where: {
          id: billID,
        },
      }
    );
  } catch (err) {
    console.error(`Failed to update property vote_id in ${billID}`);
    return err; // Reject if an exception occurs
  }
};

/**
 * If the voteID exists in the database this function will return the voteID as Number
 * @param {*} billID
 * @returns Number
 */
export const getVoteId = async (billID) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT voteID FROM bills WHERE billID = ?`;
    pool.query(sql, [billID], (err, res) => {
      if (err) {
        console.error(
          `Failed in getVoteID function from config/database with Bill Id: ${billID}`
        );
        reject(err);
      } else {
        const voteID = res[0].voteID; // Assuming the vote_id is present in the first row of the result
        resolve(voteID);
      }
    });
  });
};
export const getKnessetNumberAmount = async () => {
  return new Promise((resolve, reject) => {
    pool.query(
      `SELECT knessetNum FROM bills GROUP BY knessetNum ORDER BY knessetNum`,
      (err, res) => {
        if (err) {
          console.error(err);
          reject(err);
        }
        resolve(res);
      }
    );
  });
};
/**
 * Function to retrieve votes using complex MySql query to connect between the table,
 * and return the payload to the server.
 * @param {*} voteID
 * @returns
 */
export const retrieveVotesFromDB = async (voteID) => {
  return new Promise((resolve, reject) => {
    pool.query(
      `SELECT bills.billID, bills.billName, knesset_members.MemberID, knesset_members.FullName, vote_types.TypeID
      FROM bills
      INNER JOIN votes ON votes.voteID = bills.voteID
      INNER JOIN knesset_members ON knesset_members.MemberID = votes.KnessetMemberID
      INNER JOIN vote_types ON vote_types.TypeID = votes.VoteValue
      WHERE votes.voteID = ${voteID};`,
      (err, res) => {
        if (err) {
          console.error("checkIfVoteExistInDB Retrieve votes table error");
          reject(err);
        } else {
          const votes = res.map((row) => ({
            billID: row.billID,
            billName: row.billName,
            KnessetMemberId: row.MemberID,
            KnessetMemberName: row.FullName,
            TypeValue: row.TypeID,
          }));
          resolve(votes);
        }
      }
    );
  });
};
/**
 * Function that's check if voteID is exists on the votes table.
 * @param {*} voteID
 * @returns boolean
 */
export const checkIfVoteExistInDB = async (voteID) => {
  const valid = !(await checkQuery("votes", "voteID", voteID));
  if (valid) {
    return true;
  } else {
    return false;
  }
};
/**
 *
 * @param {*} voteID
 * @param {*} billID
 * @param {*} memberID
 * @param {*} voteValue
 */
export const isBillNotExistInDB = async (billID) => {
  return await checkQuery("bills", "billID", billID);
};

export const insertVoteForVotesRow = async (
  voteID,
  billID,
  memberID,
  voteValue
) => {
  try {
    await Vote.create({
      bill_id: billID,
      vote_id: voteID,
      mk_id: memberID,
      mk_vote: voteStringToInt(voteValue),
    });

    console.log(`Row ${i - 1} processed successfully.`);
  } catch (error) {
    console.error(`Error inserting row ${i - 1}:`, error);
    return;
  }
};
/**
 * For testing issues, query helper for using get only the bills that's have votes.
 * @returns
 */
export const getNumOfBillsWithVotes = async () => {
  return new Promise((resolve, reject) => {
    try {
      pool.query("SELECT COUNT(*) FROM bills WHERE voteID", (err, res) => {
        if (err) reject(err);
        const resCount = res[0]["COUNT(*)"];
        resolve(resCount);
      });
    } catch (err) {
      reject(err);
    }
  });
};
export const getBillsFromDatabase = async () => {
  const bills = await Bill.findAll({
    attributes: ["id", "name", "knesset_num"],
    where: {
      vote_id: {
        [Sequelize.Op.not]: null,
      },
    },
  });
  return bills.map((entry) => ({
    id: entry.id,
    label: entry.name,
    knessetNum: entry.knesset_num,
  }));
};

export const getBillsByKnessetNumFromDB = async (knessetNum) => {
  const results = await Bill.findAll({
    attributes: ["name", "id", "knesset_num"],
    where: {
      knesset_num: knessetNum,
      vote_id: {
        [Sequelize.Op.not]: null,
      },
    },
  });
  return results.map((row) => ({
    name: row.name,
    id: row.id,
  }));
};

export const insertTypeValue = async (value) => {
  try {
    await VoteType.findOrCreate({
      where: { id: value.TypeID },
      defaults: {
        type_value: value.TypeValue,
      },
    });
  } catch (error) {
    console.error("Error executing the query:", error);
  }
};
