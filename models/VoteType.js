import { Model, Sequelize } from "sequelize";
import connection from "../config/connect.js";

class VoteType extends Model {}
VoteType.init(
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
    },
    value: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  },
  { sequelize: connection, modelName: "vote_types" }
);
VoteType.bulkCreate(
  [
    { id: 0, value: "בוטל" },
    { id: 1, value: "בעד" },
    { id: 2, value: "נגד" },
    { id: 3, value: "נמנע" },
    { id: 4, value: "לא הצביע" },
  ],
  { fields: ["id", "value"] }
)
  .then(() => {
    console.log("VoteTypes created successfully.");
  })
  .catch((err) => {
    console.error("Error creating VoteTypes:", err);
  });
export default VoteType;
