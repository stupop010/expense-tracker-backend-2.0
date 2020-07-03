import { Sequelize } from "sequelize";
import "dotenv/config";

const sequelize = new Sequelize(process.env.CLEARDB_DATABASE_URL);

const models = {
  User: sequelize.import("./user"),
  Expense: sequelize.import("./expense"),
};

Object.keys(models).forEach((modelName) => {
  if ("associate" in models[modelName]) {
    models[modelName].associate(models);
  }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

export default models;
