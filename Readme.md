# creating the basics views page, index html, video chat, chat message and design css
# converting to mvc model
  create javascroipt and script tag
  create server folder: controller database model and routers
  we change views from html to ejs: ejs is a template engine that works only with an express server
                                  : he is responsible for rendering files in html
  create the server.js file with express server
  npm i express dotenv ejs socket.io mongoose morgan 

# Routing and adjsutment
# initiating WebRtc with socket.io

WebRtc:

Lors du développement pour le Web, la norme WebRTC fournit des API pour accéder aux caméras et aux micros connectés à l'ordinateur ou au smartphone. Ces appareils sont généralement appelés appareils multimédias et sont accessibles avec JavaScript via l'objet navigator.mediaDevices, qui implémente l'interface MediaDevices. Depuis cet objet, nous pouvons énumérer tous les appareils connectés, écouter les modifications apportées aux appareils (lorsqu'un appareil est connecté ou déconnecté),

appel de getUserMedia() déclenchera une demande d'autorisations.
Si l'utilisateur accepte l'autorisation, la promesse est résolue avec un élément MediaStream contenant une vidéo et une piste audio.
 Si l'autorisation est refusée, un PermissionDeniedError est renvoyé. Dans le cas contraire, un NotFoundError sera renvoyé.
                                         const constraints = {
                                                 'video': true,
                                                       'audio': true
                                                           }
                    navigator.mediaDevices.getUserMedia(constraints)
                                            .then(stream => {
                            console.log('Got MediaStream:', stream);
                        })
                        .catch(error => {
                            console.error('Error accessing media devices.', error);
                        });

# socket on Connect in server
# create and send offer:
** createOffer, is responsible for initiating the process of creating an offer in the context of a WebRTC (Web Real-Time Communication) session. 

################## $$$ Offer in WebRTC:

The process of establishing a peer-to-peer connection in WebRTC involves the exchange of session descriptions, which include SDP (Session Description Protocol) offers and answers.
 These session descriptions contain information about the media capabilities, network addresses, and other  parameters necessary for setting up the communication session.
       Here's an example scenario illustrating the role of the offer in WebRTC:
          -Alice wants to initiate a video call with Bob:

Alice's web browser creates an RTCPeerConnection object, which represents her end of the peer-to-peer connection.
           -Creating an Offer:

Alice's browser generates an SDP offer using createOffer() method of the RTCPeerConnection object. This offer includes details about Alice's media capabilities, such as supported video codecs, bandwidth constraints, and network addresses.
           -Setting Local Description:

Alice's browser sets the local description of the RTCPeerConnection to the generated offer using setLocalDescription() method. This prepares the offer to be sent to Bob.
           -Sending the Offer to Bob:

Alice's browser sends the SDP offer to Bob's browser using a signaling server or a WebSocket connection. The offer contains the session description and the details of the proposed communication session.
            -Bob Receives the Offer:

Bob's browser receives the SDP offer from Alice. Upon receiving the offer, Bob's browser creates its own RTCPeerConnection object and sets the remote description to the received offer using setRemoteDescription() method.
             -Creating an Answer:

Bob's browser then generates an SDP answer using createAnswer() method of the RTCPeerConnection object. This answer includes Bob's media capabilities and network details.
             -Setting Local Description and Sending the Answer:

Bob's browser sets the local description of the RTCPeerConnection to the generated answer and sends the answer back to Alice's browser.
            -Establishing the Connection:

Alice's browser receives Bob's answer and sets the remote description of her RTCPeerConnection to the received answer. At this point, the peer-to-peer connection is established, and both Alice and Bob can start exchanging media streams and engaging in real-time communication.

the offer in WebRTC serves as the initial proposal for establishing a communication session between peers. It contains the necessary session details and media capabilities, allowing the peers to negotiate and establish a direct peer-to-peer connection for real-time communication.

################### $$$ example
   Imagine you are planning to have a video call with a friend using a video conferencing application. In this scenario, you and your friend represent the two peers who want to establish a direct communication link for the video call.
           1/ Initiating the Video Call:

You decide to initiate the video call and send an invitation to your friend to join the call.
           2/ Your Video Call Offer:

Before the call begins, you prepare an offer that includes details about the video call session. This offer contains information such as your video and audio capabilities, preferred video codecs, and network details (such as your IP address and port numbers).

           3/Sending the Offer:

You send the offer to your friend, either by calling them and verbally communicating the details or by sending a message containing the offer.
           4/Receiving the Offer:

Your friend receives the offer and reviews the details. They now have a clear understanding of your proposed video call session, including your capabilities and preferences.
           5/Accepting the Offer and Providing an Answer:

Your friend decides to accept the offer and prepares an answer. This answer includes their own video and audio capabilities, preferred codecs, and network details.
           6/Sending the Answer:

Your friend sends the answer back to you, either by responding to your message or by verbally communicating the details during the call.
          7/Establishing the Video Call:
Upon receiving the answer, you review the details and use the information provided by your friend to configure your video call settings. With both parties now aware of each other's capabilities and preferences, the video call is established, and you can start communicating in real time.

===> In this analogy, the offer represents your initial proposal for the video call session, including your capabilities and preferences.
===>  Your friend's answer serves as a response to your offer, providing their own capabilities and preferences.
    Once both the offer and the answer are exchanged, the video call session can be configured based on the mutually agreed-upon details, allowing for a successful and efficient communication experience.


# create and send offer

  is ajax like axios?

 Yes, AJAX (Asynchronous JavaScript and XML) and Axios are both used for making HTTP requests from a web browser. However, they are different in terms of their implementation and usage.

AJAX is a set of web development techniques using various web technologies on the client side to create asynchronous web applications.
  It typically involves using the XMLHttpRequest object to send and receive data from a server without needing to refresh the entire web page. AJAX is not a specific library or framework, but rather a combination of technologies including HTML, CSS, JavaScript, and the XMLHttpRequest object.

On the other hand, Axios is a popular JavaScript library used for making HTTP requests from the browser.
   It provides a simple and easy-to-use API for performing asynchronous HTTP requests, and it supports features such  as promise-based requests and interceptors for request and response handling. Axios is often used in modern web development for its simplicity and flexibility.

In summary, while both AJAX and Axios are used for making HTTP requests from the client side, AJAX is a set of web development techniques using various technologies, while Axios is a specific JavaScript library designed for making HTTP requests.

   AJAX (Asynchronous JavaScript and XML):
    Imagine you're filling out a form on a website, and when you click "Submit," the page doesn't refresh completely, but some new information appears. That's AJAX in action. It's a way for web pages to send and receive data from a server without needing to reload the whole page. For example, when you post a comment on a social media site and it appears instantly without refreshing the page, that's likely using AJAX techniques.

   Axios:
   Now, think of Axios as a tool that makes it easier for developers to send and receive data from a server using JavaScript. It's like having a special tool in your toolbox that helps you communicate with the server more easily. For instance, if you're building a weather app and you need to fetch the current weather data from a server, you might use Axios to make that request and handle the response in a straightforward way.

## complete of createConnection function
## exchange ice candidate

An ICE (Interactive Connectivity Establishment) candidate is a network endpoint that is discovered by the ICE process during the establishment of a peer-to-peer connection in WebRTC. ICE candidates are used to facilitate communication between peers that may be located behind Network Address Translation (NAT) devices or firewalls.

In simpler terms, an ICE candidate is like an address or location that a WebRTC peer provides to the other peer to help them find each other on the internet.
 This address includes information about the peer's network configuration, such as IP addresses and port numbers, and it helps the peers establish a direct connection for real-time communication.

When two peers want to communicate using WebRTC, they exchange ICE candidates through a process called ICE gathering. Each peer collects a list of ICE candidates representing its network interfaces and sends these candidates to the other peer through a signaling server.

 The peers then use these candidates to learn about each other's network configurations and establish the most efficient communication path, even in complex networking environments.

# Build Web Rtc connection

# create data channel

In WebRTC, a data channel is a feature that allows peers to establish a direct, low-latency channel for sending arbitrary data (such as text messages, files, or any other binary data) between each other in real time. While WebRTC is often associated with audio and video communication, the data channel provides a separate pathway for exchanging non-media data, making it suitable for a wide range of applications beyond traditional video conferencing, such as online gaming, file sharing, collaborative document editing, and more.

The createDataChannel method is used to create a data channel within a WebRTC peer connection. This method is typically called on the RTCPeerConnection object and allows a peer to establish a bidirectional data channel through which it can send and receive arbitrary data. The creation of a data channel is initiated by one peer and must be agreed upon by the other peer for the channel to be established.

# creating text messaging system
# getting access to mongodb atlas
# leaving an received user update
# find new remote user


# deployment of the websites
