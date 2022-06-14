module.exports = boardRoles = (roles = "*") => {
  return function (req, res, next) {
    // console.log(
    //   req.session.user ? req.session.user.name : "-",
    //   req.originalUrl,
    //   req.body
    // );
    const id =
      req.params && req.params.id
        ? req.params.id
        : req.body && req.body.id
        ? req.body.id
        : null;
    if (id === null) return res.status(401).json("no id").end();

    const boardRoles = req.session.user.boardRoles;
    const ok = boardRoles.some(({ board, role }) => {
      if (roles === "*") {
        if (board === id) return true;
      } else if (board === id && roles.indexOf(role) !== -1) return true;
      return false;
    });
    // console.log(ok ? "accept" : "reject");
    if (ok) return next();
    res.status(401).end();
  };
};
