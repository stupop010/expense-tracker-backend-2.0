import {
  AuthenticationError,
  UserInputError,
  ForbiddenError,
} from "apollo-server";
const { GraphQLScalarType } = require("graphql");
const { Kind } = require("graphql/language");
import moment from "moment";

import "dotenv/config";

import { createToken } from "../utils/jwt";

const resolvers = {
  Query: {
    async user(parent, args, { models, user }) {
      if (!user) throw new ForbiddenError("Not authenticated.");

      return await models.User.findOne({ where: { id: user.id } });
    },
    async getAllUsers(parent, args, { models, user }) {
      if (!user) throw new ForbiddenError("Not authenticated.");
      return await models.User.findAll();
    },

    async findExpense(parent, { id }, { models, user }) {
      if (!user) throw new ForbiddenError("Not authenticated.");

      return await models.Expense.findOne({ where: { id, userId: user.id } });
    },

    async findThisYearExpenses(parent, args, { models, user }) {
      if (!user) throw new ForbiddenError("Not authenticated.");
      const Op = models.Sequelize.Op;
      const thisYear = moment().format("YYYY");

      return await models.Expense.findAll({
        where: {
          createdAt: {
            [Op.substring]: thisYear,
          },
          userId: user.id,
        },
      });
    },

    async searchDates(parent, { dates }, { models, user }) {
      if (!user) throw new ForbiddenError("Not authenticated.");
      const Op = models.Sequelize.Op;

      // Switch based on which query. Today, Yesterday, Last Month, This Year
      switch (dates) {
        case "This Year":
          const thisYear = moment().format("YYYY");

          return await models.Expense.findAll({
            where: {
              createdAt: {
                [Op.substring]: thisYear,
              },
              userId: user.id,
            },
          });
        case "Today":
          const today = moment().format("YYYY-MM-DD");
          return await models.Expense.findAll({
            where: {
              createdAt: {
                [Op.substring]: today,
              },
              userId: user.id,
            },
          });

        case "Yesterday":
          const yesterday = moment().subtract(1, "day").format("YYYY-MM-DD");
          return await models.Expense.findAll({
            where: {
              createdAt: {
                [Op.substring]: yesterday,
              },
              userId: user.id,
            },
          });

        case "Last Month":
          const lastMonth = moment().subtract(1, "month").format("YYYY-MM");
          return await models.Expense.findAll({
            where: {
              createdAt: {
                [Op.substring]: lastMonth,
              },
              userId: user.id,
            },
          });
        default:
          break;
      }

      // Dates are sent as a string not a array
      const dateSplit = dates.split(",");

      // If dateSplit === 1, argument was only a custom date
      if (dateSplit.length === 1) {
        const customDay = moment(dateSplit[0]).format("YYYY-MM-DD");

        return await models.Expense.findAll({
          where: {
            createdAt: {
              [Op.substring]: customDay,
            },
          },
        });
      } else {
        return await models.Expense.findAll({
          where: {
            createdAt: {
              [Op.between]: [
                moment(dateSplit[0]).toISOString(),
                moment(dateSplit[1]).toISOString(),
              ],
            },
          },
        });
      }
    },
  },

  Mutation: {
    async createUser(parent, { name, email, password }, { models, secret }) {
      const [user, created] = await models.User.findOrCreate({
        where: { email },
        defaults: {
          name,
          email,
          password,
        },
      });

      if (created)
        return { ...user.dataValues, token: createToken(user, secret, "300m") };

      if (user) throw new Error("Email already in use");
    },

    async signIn(parent, { email, password }, { models, secret }) {
      const user = await models.User.findOne({
        where: {
          email,
        },
      });

      if (!user) throw new Error("Invalid credentials.");

      const isValid = await user.validatePassword(password);

      if (!isValid) throw new Error("Invalid credentials.");

      return { ...user.dataValues, token: createToken(user, secret, "300m") };
    },

    async deleteUser(parent, { id }, { models, user }) {
      if (!user) throw new ForbiddenError("Not authenticated.");
      return await models.User.destroy({
        where: {
          id,
        },
      });
    },

    async createExpense(
      parent,
      { name, desc, price, category },
      { models, user }
    ) {
      if (!user) throw new ForbiddenError("Not authenticated.");

      const expense = await models.Expense.create({
        name,
        desc,
        price,
        category,
        userId: user.id,
      });

      return expense;
    },

    async editExpense(
      parent,
      { name, id, desc, price, category },
      { models, user }
    ) {
      if (!user) throw new ForbiddenError("Not authenticated.");

      const expense = await models.Expense.findOne({
        where: {
          id,

          userId: user.id,
        },
      });

      const updateData = {};

      if (name) updateData.name = name;
      if (desc) updateData.desc = desc;
      if (price) updateData.desc = price;
      if (category) updateData.desc = category;

      expense.update(updateData);

      return expense;
    },

    async deleteExpense(parent, { id }, { models, user }) {
      if (!user) throw new ForbiddenError("Not authenticated.");
      return await models.Expense.destroy({
        where: {
          id,
          userId: user.id,
        },
      });
    },
  },

  Date: new GraphQLScalarType({
    name: "Date",
    description: "Date custom scalar type",
    parseValue(value) {
      return moment(value).toISOString();
    },
    serialize(value) {
      return moment(value).format("YYYY-MM-DD");
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.String) {
        return moment(ast.value); // ast value is always in string format
      }
      return null;
    },
  }),
};

export default resolvers;
