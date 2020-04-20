module.exports = auth = (req, res, next) => {
  if (req.session.user) {
    // refresh    
    req.session.touch();
    req.userId = req.session.user._id;
    return next();
  }
  res.status(401).end();
};
