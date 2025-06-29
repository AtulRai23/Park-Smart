# Park-Smart
Park Smart is a full-stack smart parking web application that helps users find, reserve, and pay for parking spots in real time. With a map-based UI and location-aware suggestions, the app allows users to easily locate nearby available parking spots, make instant reservations, and complete payments securely using Razorpay.



*Tech Stack:->
Frontend: React, Google Maps API, Socket.IO client

Backend: Node.js, Express, MongoDB (Mongoose), Socket.IO server

Authentication: Google Sign-In + custom JWT

Payments: Razorpay (with secure webhooks)



*Key Features:->
(a) Live Location Detection – Detects and updates user location in real time.

(b) Map-Based Interface – View all available parking spots on a Google Map.

(c) Real-Time Spot Updates – Spots update instantly for all users via WebSocket (socket.io).

(d) Smart Sorting – Sort spots based on distance or price.

(e) Reservation System – Reserve a spot with countdown timer before expiration.

(f) Secure Payments – Pay via Razorpay, with verification using a secure webhook.

(g) JWT Authentication – Google login + backend-issued JWT for session control.




* How It Works:->
(1) User logs in via Google Sign-In.

(2) Map loads showing nearby unoccupied spots within 3km.

->User can:

(3) Click a spot to see details

(4) Reserve a spot (sets 10-minute timer)

->Pay via Razorpay

(5) Payment is verified on the backend via webhook, and the spot is marked as paid and reserved.

(6) All users see live updates thanks to Socket.IO integration.


## Contributors
- [AtulRai23](https://github.com/AtulRai23)  
- [AyushPrateek1](https://github.com/AyushPrateek1)
