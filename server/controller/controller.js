const mongoose = require("mongoose");
var UserDB = require("../model/model");

/* creates a new user in the database with the specified initial values for "active" and "status".
 It then sends back the ID of the newly created user. */
exports.create = (req, res) => {
  const user = new UserDB({
    active: "yes",
    status: "0",
  });

  user
    .save(user)
    .then((data) => {
      res.send(data._id);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message ||
          "Some error occoured while creating a create operation",
      });
    });
};

/*updates the user's status to "inactive" and sets the status to "0" when the user leaves. */
exports.leavingUserUpdate = (req, res) => {
  const userid = req.params.id;
  console.log("Leaving userid is: ", userid);

  UserDB.updateOne({ _id: userid }, { $set: { active: "no", status: "0" } })
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot update user with ${userid} Maybe user not found!`,
        });
      } else {
        res.send("1 document updated");
      }
    })
    .catch((err) => {
      res.status(500).send({ message: "Error update user information" });
    });
};

/*updates the user's status to "active" and sets the status to "0" when the user's remote counterpart closes. */
exports.updateOnOtherUserClosing = (req, res) => {
  const userid = req.params.id;
  console.log("Leaving userid is: ", userid);

  UserDB.updateOne({ _id: userid }, { $set: { active: "yes", status: "0" } })
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot update user with ${userid} Maybe user not found!`,
        });
      } else {
        res.send("1 document updated");
      }
    })
    .catch((err) => {
      res.status(500).send({ message: "Error update user information" });
    });
};

/*updates the user's status to "active" when a new user revisits. */
exports.newUserUpdate = (req, res) => {
  const userid = req.params.id;
  console.log("Revisited userid is: ", userid);

  UserDB.updateOne({ _id: userid }, { $set: { active: "yes" } })
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot update user with ${userid} Maybe user not found!`,
        });
      } else {
        res.send("1 document updated");
      }
    })
    .catch((err) => {
      res.status(500).send({ message: "Error update user information" });
    });
};
/*updates the user's status to "engaged" when the user is engaged in an activity. */
exports.updateOnEngagement = (req, res) => {
  const userid = req.params.id;
  console.log("Revisited userid is: ", userid);

  UserDB.updateOne({ _id: userid }, { $set: { status: "1" } })
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot update user with ${userid} Maybe user not found!`,
        });
      } else {
        res.send("1 document updated");
      }
    })
    .catch((err) => {
      res.status(500).send({ message: "Error update user information" });
    });
};

/*updates the user's status to "not engaged" when the user is no longer engaged in an activity. */
exports.updateOnNext = (req, res) => {
  const userid = req.params.id;
  console.log("Revisited userid is: ", userid);

  UserDB.updateOne({ _id: userid }, { $set: { status: "0" } })
    .then((data) => {
      if (!data) {
        res.status(404).send({
          message: `Cannot update user with ${userid} Maybe user not found!`,
        });
      } else {
        res.send("1 document updated");
      }
    })
    .catch((err) => {
      res.status(500).send({ message: "Error update user information" });
    });
};

/* finds a remote user for the given user ID based on certain criteria such as being active and having a status of "0".
 It then returns a randomly selected user that matches the criteria */
exports.remoteUserFind = (req, res) => {
  const omeID = req.body.omeID;
console.log(omeID)
  UserDB.aggregate([
    {
      $match: {
        _id: { $ne: new mongoose.Types.ObjectId(omeID) },
        active: "yes",
        status: "0",
      },
    },
    { $sample: { size: 1 } },
  ])
    .limit(1)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Error occured while retriving user information.",
      });
    });
};

/*finds the next user for the given user ID and remote user ID, excluding these users from the search.
 It returns a randomly selected user that is active and has a status of "0", excluding the specified users. */
exports.getNextUser = (req, res) => {
  const omeID = req.body.omeID;
  const remoteUser = req.body.remoteUser;
  let excludedIds = [omeID, remoteUser];

  UserDB.aggregate([
    {
      $match: {
        _id: { $nin: excludedIds.map((id) => new mongoose.Types.ObjectId(id)) },
        active: "yes",
        status: "0",
      },
    },
    { $sample: { size: 1 } },
  ])
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Error occured while retriving user information.",
      });
    });
};



/*
in the context of the provided code:
The aggregate method:
 is used to perform advanced operations on the UserDB collection,
 such as matching specific criteria, sampling data, and retrieving aggregated results based on the specified conditions.

 The $match stage:
 is used to filter the documents in the collection based on specified conditions.

The $sample stage:
 is used to randomly select a specified number of documents from the collection.
*/