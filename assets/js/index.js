let localStream; // this you webcam
let username;
let remoteUser;
// get the url
let url = new URL(window.location.href);


//this if for test before database, we dont need it after
// // username = url.searchParams.get("username"); // get the ?username=...
// remoteUser = url.searchParams.get("remoteuser");

let peerConnection; // variable that holds info of every peer connection for every user
let remoteStream;  // this is your friend's webcam
let sendChannel;
let receiveChannel;

//chat area in video chat
var msgInput = document.querySelector("#msg-input");
var msgSendBtn = document.querySelector(".msg-send-button");
var chatTextArea = document.querySelector(".chat-text-area");

/*
Retrieval of omeID from local storage and setting up username using an AJAX call if omeID is present,
otherwise generating a new omeID and setting it in the local storage
  sends a POST request to create a new user on the server, and stores the generated omeID in the local storage.
*/
var omeID = localStorage.getItem("omeID");



/* 
 user authentication and initialization. When a user first enters the application, the omeID is checked.
 If it exists, the user's information is updated on the server.
 If it doesn't exist, a new user is created on the server, and the received ID is stored in the local storage for future use.
*/

if (omeID) {
  // assigns the value of omeID to the username variable.
  username = omeID;

  // sends a PUT request to "/new-user-update/" with the omeID as part of the URL.
  // This is to update the user's information on the server.
  $.ajax({
    url: "/new-user-update/" + omeID + "",
    type: "PUT",
    success: function (response) {
      console.log(response);
    },
  });
}     
   else {
  var postData = "Demo Data";

  // sends a POST request to "/api/users" with the postData.
  $.ajax({
    type: "POST",
    url: "/api/users",
    data: postData,

    //If the POST request is successful, it logs the response from the server,
    // sets the omeID in the local storage with the response, and assigns the response to the username variable.
    success: function (response) {
      console.log(response);
      localStorage.setItem("omeID", response);
      username = response;
    },
    error: function (error) {
      console.log(error);
    },
  });
}

/*
Requests access to the user's media devices (video and audio) using navigator.mediaDevices.getUserMedia.

Sets the local media stream to a video element with id "user-1".
Makes a POST request to retrieve remote users and creates an offer for the first remote user received.
Once the local media stream is obtained, it sets the stream to a video element with the ID "user-1".

navigator.mediaDevices.getUserMedia is a JavaScript function that is part of the WebRTC (Web Real-Time Communication) API. 
It is used to request access to the user's media devices, such as the camera and microphone, in order to capture audio and video streams. 
If the user grants permission, the function returns a Promise that resolves with a MediaStream object representing
   the user's audio and video streams. This MediaStream object can then be used to display the user's video feed,
      capture audio input, or transmit the media stream to other users in a WebRTC session.
*/
let init = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  //sets this stream to a video element with the ID "user-1" to display the user's own video feed within the application's user interface.
  document.getElementById("user-1").srcObject = localStream;

$.post("https://simpleomegleclone.vercel.app/get-remote-users", { omeID: omeID })

    .done(function (data) {
      console.log("Remoteuser id from Init() /get-remote-users: ", data[0]._id);
      if (data[0]) {
        if (data[0]._id == remoteUser || data[0]._id == username) {
        } else {
          remoteUser = data[0]._id;
          createOffer(data[0]._id);
        }
      }
    })

    .fail(function (xhr, textStatus, errorThrown) {
      console.log(xhr.responseText);
    });
};

init();

/*
Establishes a socket connection and emits a "userconnect" event with the user's username when connected.
When the socket connection is established, it emits a "userconnect" event to the server,
sending the user's displayName (presumably the username) as part of the event data.
This event serves to notify the server of the user's connection and may trigger further actions on the server side,
 such as updating user statuses or handling new connections.
 
 */
let socket = io.connect();

//send socket info to server
socket.on("connect", () => {
  if (socket.connected) {
    //send data from socket to server with keyword emit, emit event called userconnect 
    socket.emit("userconnect", {
      displayName: username,
    });
  }
});

/* server confguration */
/*This object defines how the peer connection is set up and should contain information about the ICE servers to use.

The iceServers property within the servers object specifies the configuration for ICE (Interactive Connectivity Establishment) servers, which are essential for WebRTC communication.
The iceServers property is an array that contains one or more ICE server configurations.
ICE servers are used in WebRTC to facilitate the exchange of network and media information between peers, allowing them to establish
 direct peer-to-peer connections even when they are behind NAT (Network Address Translation) or firewalls.
Within the iceServers array, there is an object that specifies the configuration for a STUN (Session Traversal Utilities for NAT) server.
  STUN servers are used to discover the public IP address and port of a peer, which is necessary for establishing direct communication over the Internet.
urls Property:
  The urls property within the STUN server configuration specifies the URLs of the STUN servers. In this case, the code specifies two STUN servers hosted
   by Google with the URLs "stun:stun1.1.google.com:19302" and "stun:stun2.1.google.com:19302".
  By specifying STUN and possibly TURN (Traversal Using Relays around NAT) servers in the iceServers configuration,
   WebRTC applications can optimize the process of establishing direct peer-to-peer connections and handle various network configurations.*/
let servers = {

  iceServers: [
    {
      urls: ["stun:stun1.1.google.com:19302", "stun:stun2.1.google.com:19302"],
    },
  ],
};


let createPeerConnection = async () => {

   //initializes a new RTCPeerConnection object, which represents a WebRTC connection between the local and remote peers.
  peerConnection = new RTCPeerConnection(servers);
   
  //new MediaStream object named remoteStream is created. This stream is then assigned to a video element with the ID "user-2" using srcObject.
  // This likely sets up the video element to display the remote peer's video stream once it's received.
  remoteStream = new MediaStream();

  document.getElementById("user-2").srcObject = remoteStream;
 

   //iterates through the tracks in the localStream (presumably representing the local user's audio and video tracks) and adds each track
   // to the peerConnection using addTrack. This allows the local audio and video tracks to be transmitted to the remote peer.
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  //when a new track is added to the peerConnection, the ontrack event is triggered.
  // This code then adds the received track to the remoteStream, allowing the remote peer's audio and video tracks to be displayed in the "user-2" video element.
  peerConnection.ontrack = async (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  // handles the oninactive event of the remoteStream. If the remote stream becomes inactive,
  // it disables all tracks in the stream and closes the peerConnection.
  remoteStream.oninactive = () => {
    remoteStream.getTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    peerConnection.close();
  };

  //When the local ICE agent needs to deliver a new ICE candidate to the remote peer through the signaling server,
  // the onicecandidate event is triggered. This code then emits the ICE candidate data to the remote user via a socket,
  // allowing the peers to exchange network information for establishing a direct connection. 
  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      // fire an event "candidateSentToUser"
      socket.emit("candidateSentToUser", {
        username: username,
        remoteUser: remoteUser,
        iceCandidateData: event.candidate,
      });
    }
  };

  
  //creates a new data channel named "sendDataChannel" on the peerConnection.
  // When the data channel is opened, the onopen event is triggered, and the code logs a message to the console
  // and calls onSendChannelStateChange to handle the open state of the data channel.

  sendChannel = peerConnection.createDataChannel("sendDataChannel");
  sendChannel.onopen = () => {
    console.log("Data channel is now open and ready to use");
    onSendChannelStateChange();
  };

  //this line sets up a handler for when a data channel is created on the peerConnection.
  // When a data channel is established, the receiveChannelCallback function will be invoked to handle the incoming data channel.
  peerConnection.ondatachannel = receiveChannelCallback;

  // sendChannel.onmessage=onSendChannelMessageCallBack; //
};

//function to hire when send button is clicked
function sendData() {
  //retrieves the value of the message input from the msgInput element
  const msgData = msgInput.value;

  // appends the user's message to the chatTextArea element, 
  //displaying the message in the chat interface with a "Me:" label to indicate that it's the user's own message.

  chatTextArea.innerHTML +=
    "<div style='margin-top:2px; margin-bottom:2px;'><b>Me: </b>" +
    msgData +
    "</div>";

  //checks if the sendChannel is available and valid.
  if (sendChannel) {

    //If the sendChannel is available, this line calls the onSendChannelStateChange function,to handle the state of the data channel.
    onSendChannelStateChange();

    //sends the msgData (user's message) over the sendChannel to the remote peer.
    sendChannel.send(msgData);
    //clears the message input field after sending the message.
    msgInput.value = "";
  } 

  //If the sendChannel is not available, this block of code sends the msgData over the receiveChannel to the remote peer.
  // It then clears the message input field.
  else {
    receiveChannel.send(msgData);
    msgInput.value = "";
  }
}

//callback function that is invoked when a new data channel is created  
function receiveChannelCallback(event) {
  console.log("Receive Channel Callback");

  // assigns the newly created data channel from the event to the receiveChannel variable, allowing the application to reference and use this channel for receiving data from the remote peer.
  receiveChannel = event.channel;

  //sets the onmessage event handler of the receiveChannel to the onReceiveChannelMessageCallback function.
  // This means that when a message is received on the receiveChannel, the onReceiveChannelMessageCallback function will be called to handle the received message.
  receiveChannel.onmessage = onReceiveChannelMessageCallback;

  // sets the onopen event handler of the receiveChannel to the onReceiveChannelStateChange function.
  //This allows the application to handle the state change when the receive channel is opened.
  receiveChannel.onopen = onReceiveChannelStateChange;

  // sets the onclose event handler of the receiveChannel to the onReceiveChannelStateChange function.
  // This allows the application to handle the state change when the receive channel is closed.
  receiveChannel.onclose = onReceiveChannelStateChange;
}

//callback function that is invoked when a message is received on the data channel
function onReceiveChannelMessageCallback(event) {
  console.log("Received Message");
  //appends the received message to the chatTextArea element in the user interface. 
  //It formats the message to include a "Stranger:" label followed by the actual message content, and then appends it to the chatTextArea for display.
  chatTextArea.innerHTML +=
    "<div style='margin-top:2px; margin-bottom:2px;'><b>Stranger: </b>" +
    event.data +
    "</div>";
}

//handle the state changes of a receive channel 
function onReceiveChannelStateChange() {
  //retrieves the current state of the receiveChannel and stores it in the variable readystate.
  const readystate = receiveChannel.readystate;

  console.log("Receive channel state is: " + readystate);
  if (readystate === "open") {
    console.log(
      "Data channel ready state is open - onReceiveChannelStateChange"
    );
  } else {
    console.log(
      "Data channel ready state is NOT open - onReceiveChannelStateChange"
    );
  }
}

//handle the state changes of a data channel in WebRTC. 
function onSendChannelStateChange() {

  // retrieves the current state of the sendChannel
  const readystate = sendChannel.readystate;
  console.log("Send channel state is: " + readystate);

  //checks if the data channel's state is "open". If it is, a message indicating that the data channel is ready and open is logged to the console.
  if (readystate === "open") {
    console.log("Data channel ready state is open - onSendChannelStateChange");
  } 

  // Otherwise, a message indicating that the data channel is not open is logged.
  else {
    console.log(
      "Data channel ready state is NOT open - onSendChannelStateChange"
    );
  }
}

//fetching the next user from a server 
function fetchNextUser(remoteUser) {  //he function is invoked with the remoteUser parameter, which represents the current remote user with whom the local user is interacting.
  
  //TTP POST request is made to the URL using $.post. The request includes the omeID and remoteUser as data parameters.
  $.post(
    "https://simpleomegleclone.vercel.app/get-next-user",
    { omeID: omeID, remoteUser: remoteUser },

    //Handling the Response:
    function (data) {
      console.log("Next user is: ", data);
      //It then checks if data[0] exists and if the _id of the first element in the data array is not the same as the current remoteUser or the username.
      if (data[0]) {
        if (data[0]._id == remoteUser || data[0]._id == username) {
        } 
        
        //If the conditions are met, it updates the remoteUser with the new _id from data[0] and calls the createOffer function with the new remoteUser.
        else {
          remoteUser = data[0]._id;
          createOffer(data[0]._id);
        }
      }
    }
  );
}

/*initiating peer connection*/
let createOffer = async (remoteU) => {

  createPeerConnection();

  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

    // emit event: offerSentToRemote
  socket.emit("offerSentToRemote", {
    username: username,
    remoteUser: remoteU,
    offer: peerConnection.localDescription,
  });

  console.log("from Offer");
};


// createAnswer fucntion 
let createAnswer = async (data) => {//// data is the offer basically
       //set remoteUser based on the username received in the data parameter. It then proceeds to create a new peer connection using the createPeerConnection function. 
  remoteUser = data.username;
  createPeerConnection();

     //The function sets the remote description of the peer connection using the offer received from the other peer (data.offer).
     // This offer contains the details of the other peer's capabilities and preferences for the session.
  await peerConnection.setRemoteDescription(data.offer);

    //creates an answer using peerConnection.createAnswer().The answer includes the local peer's capabilities and preferences for the session.
  let answer = await peerConnection.createAnswer();
   
    //The function then sets the local description of the peer connection to the generated answer using peerConnection.setLocalDescription(answer).
    // Subsequently, it emits the answer to the other peer using a socket event named "answerSentToUser1", providing the answer, sender, and receiver information.
  await peerConnection.setLocalDescription(answer);

  socket.emit("answerSentToUser1", {
    answer: answer,
    sender: data.remoteUser,
    receiver: data.username,
  });

  console.log("from answer");

  //Following the emission of the answer, the code updates the engagement status by making a PUT request to the server using AJAX.
  //Additionally, it enables UI interaction by setting the pointer events of an element with the class "next-chat" to "auto".
  document.querySelector(".next-chat").style.pointerEvents = "auto";
  $.ajax({
    url: "/update-on-engagement/" + username + "",
    type: "PUT",
    success: function (response) {},
  });
};

// create answer based of the receiveoffer event from server by one peer in response to offer from a another peer
socket.on("ReceiveOffer", function (data) { 

  createAnswer(data);
});


//handling of an incoming answer from a remote peer 
let addAnswer = async (data) => { //It takes data as a parameter, which contains the answer and other relevant information.

  //The function first checks if the currentRemoteDescription of the peer connection is not set.
  // If it's not set, it sets the remote description of the peer connection to the received answer using peerConnection.setRemoteDescription(data.answer).
  // This step is crucial for establishing the connection and ... ... the media streams between peers.
  if (!peerConnection.currentRemoteDescription) {
    peerConnection.setRemoteDescription(data.answer);
  }
    //After handling the answer, the code enables UI interaction by setting the pointer events of an element with the class "next-chat" to "auto".
    //This likely allows the user to interact with the user interface, such as initiating the next action in the communication flow.
  document.querySelector(".next-chat").style.pointerEvents = "auto";

  //Following the handling of the answer and enabling UI interaction, the code makes a PUT request to the server using AJAX
  // to update the engagement status. This step likely informs the server about the successful establishment of the connection with the remote peer.
  $.ajax({
    url: "/update-on-engagement/" + username + "",
    type: "PUT",
    success: function (response) {},
  });
};



// add answer based of the receiveAnswer event from server by one peer in response to offer from a another peer
socket.on("ReceiveAnswer", function (data) {
  addAnswer(data);
});


  /*cleans up the WebRTC connection with the remote user, updates the user's status on the server, and fetches the next user for the session */
socket.on("closedRemoteUser", function (data) {
  // .................Newly Added..........................

  // retrieves the remote stream from the peerConnection and 
  //stops all tracks in the stream by iterating through each track and calling the stop method on it.
  const remoteStream = peerConnection.getRemoteStreams()[0];
  remoteStream.getTracks().forEach((track) => track.stop());
  
  // closes the peerConnection by calling the close method on it.
  peerConnection.close();
  //retrieves the video element for the remote user with the ID "user-2".
  const remoteVid = document.getElementById("user-2");

  //If the video element's srcObject is not null, it stops all tracks in its srcObject by iterating
  // through each track and calling the stop method on it. Then it sets the srcObject to null.
  if (remoteVid.srcObject) {
    remoteVid.srcObject.getTracks().forEach((track) => track.stop());
    remoteVid.srcObject = null;
  }
  // .................Newly Added..........................

  //It sends a PUT request to "/update-on-next/" with the username as part of the URL.
  // Upon a successful response, it calls the fetchNextUser function with the remoteUser as an argument.
  $.ajax({
    url: "/update-on-next/" + username + "",
    type: "PUT",
    success: function (response) {
      fetchNextUser(remoteUser);
    },
  });
});


//listen to event candidateReceiver from server
socket.on("candidateReceiver", function (data) {
  peerConnection.addIceCandidate(data.iceCandidateData);
  console.log("from candidateReceiver");
});



//add event listener when btnSend is clicked
msgSendBtn.addEventListener("click", function (event) {
  sendData();
});



/*When the "unload" event is detected, it checks if the user's browser is Chrome using the navigator.userAgent.indexOf("Chrome") method.
 If it is, it sends an AJAX request to the server to update the user's status and logs a message indicating that the local user is leaving.
  Then it sends another AJAX request to update the status of the remote user and logs a message indicating that the remote user is leaving.
   Finally, it logs a message saying "This is Chrome".
If the user's browser is not Chrome, it checks if the browser is Firefox using navigator.userAgent.indexOf("Firefox").
 If it is, it sends similar AJAX requests to update the user's status, logs messages for both local and remote users,
  and logs a message saying "This is Firefox".
If the user's browser is neither Chrome nor Firefox, it logs a message saying "This is not Chrome or Firefox". */
window.addEventListener("unload", function (event) {
  if (navigator.userAgent.indexOf("Chrome") != -1) {
    $.ajax({
      url: "/leaving-user-update/" + username + "",
      type: "PUT",
      success: function (response) {
        console.log(response);
      },
    });
    console.log("Leaving local user is: ", username);
    // ..........................Newly Edited
    $.ajax({
      url: "/update-on-otherUser-closing/" + remoteUser + "",
      type: "PUT",
      success: function (response) {
        console.log(response);
      },
    });
    console.log("Leaving remote user is: ", remoteUser);
    // ..........................Newly Edited
    console.log("This is Chrome");
  } else if (navigator.userAgent.indexOf("Firefox") != -1) {
    // The browser is Firefox
    $.ajax({
      url: "/leaving-user-update/" + username + "",
      type: "PUT",
      async: false,
      success: function (response) {
        console.log(response);
      },
    });
    console.log("Leaving local user is: ", username);
    // ..........................Newly Edited
    $.ajax({
      url: "/update-on-otherUser-closing/" + remoteUser + "",
      type: "PUT",
      async: false,
      success: function (response) {
        console.log(response);
      },
    });
    console.log("Leaving remote user is: ", remoteUser);
    // ..........................Newly Edited

    console.log("This is Firefox");
  } else {
    // The browser is not Chrome or Firefox
    console.log("This is not Chrome or Firefox");
  }
});


async function closeConnection() {
  // .................Newly Added..........................
  //retrieves the remote stream from the peerConnection, stops all tracks in the stream, and then closes the peerConnection.
  const remoteStream = peerConnection.getRemoteStreams()[0];
  remoteStream.getTracks().forEach((track) => track.stop());
  await peerConnection.close();

  //retrieves the video element for the remote user and stops all tracks in its srcObject if it exists.
  const remoteVid = document.getElementById("user-2");

  if (remoteVid.srcObject) {
    remoteVid.srcObject.getTracks().forEach((track) => track.stop());
    remoteVid.srcObject = null;
  }
  // .................Newly Added..........................
  // emits a "remoteUserClosed" event via a socket, sending the username and remoteUser as data.
  socket.emit("remoteUserClosed", {
    username: username,
    remoteUser: remoteUser,
  });

  //sends a PUT request to "/update-on-next/" with the username as part of the URL.
  $.ajax({
    url: "/update-on-next/" + username + "",
    type: "PUT",
    // Upon success, it calls the fetchNextUser function with the remoteUser as an argument. 
    success: function (response) {
      fetchNextUser(remoteUser);
    },
  });

  console.log("From closeConnection");
}



/*
There are commented-out lines that suggest a conditional check for the connection state and handling different scenarios based on the state. 
It seems that if the connection is open, it logs "Peer connection closed", and if not, it fetches the next user and logs "Moving to next user".
 */
$(document).on("click", ".next-chat", function () {

  //The content of the element with the class "chat-text-area" is cleared.
  document.querySelector(".chat-text-area").innerHTML = "";

  // if (
  //   peerConnection.connectionState === "connected" ||
  //   peerConnection.iceCandidateState === "connected"
  // ) {

  //The closeConnection function is called, which closes the current connection with the remote user.
  closeConnection();
  
  //An event handler is set for the oniceconnectionstatechange event of the peerConnection.
  // When the ICE connection state changes, the code checks if the connection is "disconnected" or "closed"  
  peerConnection.oniceconnectionstatechange = (event) => {
    if (
      peerConnection.iceConnectionState === "disconnected" ||
      peerConnection.iceConnectionState === "closed"
    ) {
      // Peer connection is closed
      console.log("Peer connection closed.");
    }
  };
  //   console.log("User closed");
  // } else {
  //   fetchNextUser(remoteUser);
  //   console.log("Moving to next user");
  // }
});










/* important inforamtion:



*/
