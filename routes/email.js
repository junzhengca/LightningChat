module.exports = (app, util, db, bot) => {
  app.post('/email', (req, res) => {
    if(req.body.from && req.body.message && util.validateEmail(req.body.from)) {
      var from = req.body.from
      var message = req.body.message
      util.getMailingList().forEach((email) => {
        var data = {
          from: 'Lightning <lightning@bot.amacss.org>',
          to: email,
          subject: 'New message from ' + req.body.from,
          text: "New message from " + req.body.from + " - \n\n" +
                req.body.message + "\n\n" +
                "Please do not reply to this email."
        }
        util.mailgun.messages().send(data, function (error, body) {
          console.log(body)
        })
      })
      res.send({status: "ok"})
    } else {
      res.status(400)
      res.send({status: "bad request"})
    }
  })
}
