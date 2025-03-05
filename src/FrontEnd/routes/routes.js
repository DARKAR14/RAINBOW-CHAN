const { Router } = require("express");
const passport = require("../server/passport");
const { auth } = require("../util/middleware/auth");
const router = Router();

router.get("/", (req, res) => {
  res.render("home");
});

router.get("/login", passport.authenticate("discord"), (req, res) => {
  res.redirect("/dash");
});

router.use("/", require('./dash.routes'))

// Ruta base que muestra que el bot está en línea
router.get("/ping", (req, res) => {
    res.send("🌈 RAINBOW-CHAN 🌈 está en línea y funcionando perfectamente!");
  });

module.exports = router;