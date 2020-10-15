module.exports = {
  ensureAuthenticated: function(req, res, next) {
      if (req.isAuthenticated()) {
          return next();
      }
      req.flash('error_msg', 'Kérem, jelentkezzen be.');
      res.redirect('/admin/login');
  },
  forwardAuthenticated: function(req, res, next) {
      if (!req.isAuthenticated()) {
          return next();
      }
      res.redirect('/admin/dashboard');
  }
};
