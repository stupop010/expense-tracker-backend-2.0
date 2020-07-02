import jwt from "jsonwebtoken";
import { AuthenticationError } from "apollo-server";

export const getUser = async (req) => {
  const token = req.headers["x-token"];
  if (token) {
    try {
      return await jwt.verify(token, process.env.SECRET);
    } catch (error) {
      // throw new AuthenticationError("Your session expired. Sign in again.");
      return null;
    }
  }
};

export const createToken = async (user, secret, expiresIn) => {
  const { id, email, name } = user;
  return await jwt.sign({ id, email, name }, secret, { expiresIn });
};
