import { gql } from "apollo-server-express";

const typeDefs = gql`
  type User {
    id: Int
    name: String!
    email: String!
    password: String!
    token: String!
  }

  type Expense {
    id: Int!
    name: String!
    price: String!
    category: String!
    desc: String!
    userId: Int!
  }

  type Token {
    token: String!
  }

  type Query {
    user: User
    getAllUsers: [User]

    findExpense(id: Int!): Expense
    findAllExpenses: [Expense]

    searchDates(dates: String!): [Expense]
  }

  type Mutation {
    createUser(name: String!, email: String!, password: String!): User!
    signIn(email: String!, password: String!): User!
    deleteUser(id: Int!): Boolean!

    createExpense(
      name: String!
      desc: String!
      price: String!
      category: String!
    ): Expense!

    editExpense(
      name: String
      id: Int!
      desc: String!
      price: String!
      category: String!
    ): Expense!

    deleteExpense(id: Int!): Boolean!
  }
`;

export default typeDefs;
