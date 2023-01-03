const fs = require("fs");
const pD = require("./prettyDate");
path = "./logs/logall.txt";

function logApi(req, res, type, reason) {
  username = req.body.user;
  console.log(!fs.existsSync(path));
  if (!fs.existsSync(path)) {
    console.log("If-Abfrage");
    fs.writeFile(path, "created logging file", (err) => {
      if (err) {
        console.log(err);
      }
    });
  }
  switch (type) {
    case "registration":
      switch (reason) {
        //everything worked fine
        case "0":
          var content =
            "\n" + pD.prettyDate() + " registration " + username + " Worked";
          fs.appendFile(path, content, (err) => {
            if (err) {
              console.error(err);
            }
          });
          break;

        //Username is already in Use
        case "1":
          var content =
            "\n" +
            pD.prettyDate() +
            " registration " +
            username +
            "Failed due to an existing User with this Username";
          fs.appendFile(path, content, (err) => {
            if (err) {
              console.error(err);
            }
          });
          break;
          case "2":
            var content =
            "\n" +
            pD.prettyDate() +
            " registration " +
            username +
            "Failed due to an empty response";
          fs.appendFile(path, content, (err) => {
            if (err) {
              console.error(err);
            }
          });
          break;
        default:
          console.log("Wrong reason");
      }
      break;
    default:
      console.log("Wrong service input");
  }
}

module.exports = { logApi };
