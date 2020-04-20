import React, { cloneElement } from "react";
import { User } from "./user";

const providers = [<User.Provider />];

const Store = ({ children: initial }) =>
  providers.reduce(
    (children, parent) => cloneElement(parent, { children }),
    initial
  );

export { Store, User };