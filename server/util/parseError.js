module.exports = parseError = (error) => {
  // mongoose validation err
  if (error.name && error.name === "ValidationError") {
    let errors = [];
    for (const p in error.errors) {
      errors.push(error.errors[p]["message"]);
    }
    return { statusCode: 400, msg: "Validation Error", errors };
  }
  // custom err
  if (error.statusCode && Number.isInteger(error.statusCode)) return error;
  // other err
  console.log(error);
  const errData = { statusCode: 500, msg: "Error" };
  if (process.env.NODE_ENV === "development") errData.error = error;
  return errData;
};
