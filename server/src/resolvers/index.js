import {
  AuthenticationError,
  UserInputError,
  ForbiddenError,
} from "apollo-server";
import "dotenv/config";
import moment from "moment";

import { createToken } from "../utils/jwt";

const resolvers = {
  Query: {
    async user(parent, args, { models, user }) {
      if (!user) throw new ForbiddenError("Not authenticated.");

      const u = await models.User.findOne({ where: { id: user.id } });
      return u;
    },
    async getAllUsers(parent, args, { models, user }) {
      // if (!user) throw new ForbiddenError("Not authenticated.");
      return await models.User.findAll();
    },

    async findExpense(parent, { id }, { models, user }) {
      if (!user) throw new ForbiddenError("Not authenticated.");

      return await models.Expense.findOne({ where: { id, userId: user.id } });
    },

    async findAllExpenses(parent, args, { models, user }) {
      if (!user) throw new ForbiddenError("Not authenticated.");
      return await models.Expense.findAll();
    },

    async searchDates(parent, { dates }, { models, user }) {
      if (!user) throw new ForbiddenError("Not authenticated.");
      const Op = models.Sequelize.Op;

      // Dates are sent as a string not a array
      const dateSplit = dates.split(",");

      if (dateSplit.length === 1) {
        // Sequelize is currently querying the day before the argument
        // Its querying at 23:00. Added 24 hour
        // query will be prev day at 23:00 and current day at 23:00
        const day = moment(dateSplit[0]).add(24, "h").toISOString();
        const expenses = await models.Expense.findAll({
          where: {
            createdAt: {
              [Op.between]: [moment(dateSplit[0]).toISOString(), day],
            },
          },
        });

        return expenses;
      }

      const expenses = await models.Expense.findAll({
        where: {
          createdAt: {
            [Op.between]: [
              moment(dateSplit[0]).toISOString(),
              moment(dateSplit[1]).toISOString(),
            ],
          },
        },
      });

      return expenses;
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
      // if (!user) throw new ForbiddenError("Not authenticated.");
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
      // if (!user) throw new ForbiddenError("Not authenticated.");

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
};

export default resolvers;
