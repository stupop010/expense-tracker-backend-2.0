import {
  AuthenticationError,
  UserInputError,
  ForbiddenError,
} from "apollo-server";
import "dotenv/config";

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
      // if (!user) throw new ForbiddenError("Not authenticated.");
      const userId = 1;
      return await models.Expense.findOne({ where: { id, userId } });
    },

    async findAllExpenses(parent, args, { models, user }) {
      // if (!user) throw new ForbiddenError("Not authenticated.");
      return await models.Expense.findAll();
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

    async editExpense(parent, { name, id }, { models, user }) {
      // if (!user) throw new ForbiddenError("Not authenticated.");
      const expense = await models.Expense.findOne({
        where: {
          id,
          // TODO change userId to = user.id
          userId: 1,
        },
      });

      const updateData = {};

      if (name) updateData.name = name;

      expense.update(updateData);

      return expense;
    },

    async deleteExpense(parent, { id }, { models, user }) {
      // if (!user) throw new ForbiddenError("Not authenticated.");
      // return await models.Expense.destroy({
      //   where: {
      //     id,
      //     userId: user.id,
      //   },
      // });
      console.log(id);
    },
  },
};

export default resolvers;
