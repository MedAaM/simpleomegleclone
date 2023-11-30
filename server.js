const express = require("express");
const path = require("path");


const app = express();
const connectDB = require("./server/database/connection.js"); // database

PORT=8080;
connectDB();

app.use(express.urlencoded({ extended: true }));
//used to process data sent in https or http request body 
app.use(express.json());
// set view engine
app.set("view engine", "ejs");
// instead of writing in html (ejs files) assets/css/... we just write /css/...
app.use("/css", express.static(path.resolve(__dirname, "assets/css")));
app.use("/img", express.static(path.resolve(__dirname, "assets/image")));
app.use("/js", express.static(path.resolve(__dirname, "assets/js")));

 // render the ejs files
app.use("/", require("./server/routes/router.js"));


//app listen
var server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


//start socket on server
const io = require("socket.io")(server, {
  allowEIO3: true, //False by default
});

//store all the users connections
var userConnection = [];




//on connection 
io.on("connection", (socket) => {
  console.log("Socket id is: ", socket.id); // socket id is unique for every user
   //receive the data sent from the client side (event called userconnect)

  socket.on("userconnect", (data) => {
    console.log("Logged in username", data.displayName);
    userConnection.push({  //push to array  
      connectionId: socket.id,
      user_id: data.displayName,
    });

    var userCount = userConnection.length;
    console.log("UserCount", userCount);
  });




    // receive: offerSentToRemote event from client
  socket.on("offerSentToRemote", (data) => {

    var offerReceiver = userConnection.find(
      (o) => o.user_id === data.remoteUser  // o is every item in the array
    );

    if (offerReceiver) {
      console.log("OfferReceiver user is: ", offerReceiver.connectionId); //
      //send info to user by emiting an event ReceiveOffer with the data
      socket.to(offerReceiver.connectionId).emit("ReceiveOffer", data);
    }
  });



  // receive: answerSentToUser1 event from client
  socket.on("answerSentToUser1", (data) => {
    var answerReceiver = userConnection.find(
      (o) => o.user_id === data.receiver
    );
    if (answerReceiver) {
      console.log("answerReceiver user is: ", answerReceiver.connectionId);
      socket.to(answerReceiver.connectionId).emit("ReceiveAnswer", data);
    }
  });
    



  //listen to candidateSentToUser from client
  socket.on("candidateSentToUser", (data) => {
    var candidateReceiver = userConnection.find(
      (o) => o.user_id === data.remoteUser
    );
    if (candidateReceiver) {
      console.log(
        "candidateReceiver user is: ",
        candidateReceiver.connectionId
      );
      socket.to(candidateReceiver.connectionId).emit("candidateReceiver", data); // fire event:candidateReceiver
    }
  });



   // on disconnect remove user from array
  socket.on("disconnect", () => {
    console.log("User disconnected");
    // var disUser = userConnection.find((p) => (p.connectionId = socket.id)); //find who is the user who disconnected
    // if (disUser) {
    userConnection = userConnection.filter((p) => p.connectionId !== socket.id);
    console.log(
      "Rest users username are: ",
      userConnection.map(function (user) {
        return user.user_id;
      })
    );
    // }
  });



      //listen to remoteUserClosed from client
  socket.on("remoteUserClosed", (data) => {
    var closedUser = userConnection.find((o) => o.user_id === data.remoteUser);
    if (closedUser) {
      console.log("closedUser user is: ", closedUser.connectionId);
      socket.to(closedUser.connectionId).emit("closedRemoteUser", data); //fire event: closedRemoteUser
    }
  });
});
