const express = require("express");
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

const cors = require("cors");
app.use(
  cors({
    origin: ["http://localhost:5173","https://hottle-service.web.app",],
    credentials: true,
  })
);
// app.use(cors)
app.use(express.json());
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ruyf0su.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    
    const hottleRoomCullection = client
      .db("hottleManagement")
      .collection("roomsInfo");
    const userBookerDCollerction = client
      .db("hottleManagement")
      .collection("usersBookedRoom");
    const userReviueCollection = client
      .db("hottleManagement")
      .collection("usersReviues");
    // Create A new Room

    app.post("/roomdInfo", async (req, res) => {
      const newRoom = req.body;
      // console.log(newRooms);
      const result = await hottleRoomCullection.insertOne(newRoom);
      return res.send(result);
    });

    // Viue The Rooms Information
    app.get("/roomdInfo", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const sort = req.query.sort; // Assuming sort is a string indicating sort order
  
      let sortParams = { pricePerNight: 1 }; // Default ascending sort
  
      if (sort === "desc") {
          sortParams = { pricePerNight: -1 }; // Descending sort
      }
  
      const result = await hottleRoomCullection
          .find()
          .sort(sortParams)
          .skip(page * size)
          .limit(size)
          .toArray();
  
      return res.send(result);
  });
  

    //PAgginatio
    app.get("/roomCount", async (req, res) => {
      const count = await hottleRoomCullection.estimatedDocumentCount();
      return res.send({ count });
    });
    // Details Api
    app.get("/rooms/description/:room", async (req, res) => {
      const room = req.params.room;
      const query = { name: room }; // Use a string-based query
      try {
        const result = await hottleRoomCullection.find(query).toArray();
        return res.send(result);
      } catch (error) {
        res.status(500).send("Internal Server Error: " + error.message);
      }
    });

    // Add Card Api
    // app.post("/mybookings", async (req, res) => {
    //   try {
    //     const booking = req.body;
    //     const result = await userBookerDCollerction.insertOne(booking);
    //     res.json({ message: 'Booking data saved successfully' });
    //   } catch (error) {
    //   //   res.status(500).json({ error: 'An error occurred while saving the booking data.' });
    //   }
    // });
    app.post("/mybookings", async (req, res) => {
      const booking = req.body;

      // res.json({ message: 'Booking data saved successfully' });
      console.log(booking);
      const result = await userBookerDCollerction.insertOne(booking);
      // console.log(result);
      res.send(result);

      // Data  backend e jacche mongodb te jacche kintu error asche keno?
    });

    app.get("/bookingRooms", async (req, res) => {
      // const userEmail = req.query.email;
      const email = req.query.email;
      const filter = { email: email };
      const result = await userBookerDCollerction.find(filter).toArray();

      // console.log(email);
      return res.send(result);
    });

    // Cancle Booked
    app.delete("/bookingRooms/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = {
        _id: new ObjectId(id),
      };
      const result = await userBookerDCollerction.deleteOne(query);
      // console.log(result);
      res.send(result);
    });

  

    // Date update

    app.get("/updateDate/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await userBookerDCollerction.find(filter).toArray();
      // console.log(id);
      return res.send(result);
    });

    app.patch("/updateDate/:id", async (req, res) => {
      // const updateBooking = req.body;
      // const id = req.params.id;
      // console.log(updateBooking);

      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const option = { upsert: true };
        const updateBooking = req.body;
        console.log(id);
        const updateDate = {
          $set: {
            startDate: updateBooking.startDate,
            endDate: updateBooking.endDate,
          },
        };

        const result = await userBookerDCollerction.updateOne(
          query,
          updateDate,
          option
        );
        res.json(result);
      } catch (error) {
        console.error("Error updating date:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });



    //users reviues
    app.post("/usersReviues", async (req, res) => {
      const reviues = req.body;
      console.log(reviues);
      const result = await userReviueCollection.insertOne(reviues);
      return res.send(result);
    });

    // get revius

    app.get("/reviues", async (req, res) => {
      const room = req.query.name;
      const filter = { selectedValue: room };
      const result = await userReviueCollection.find(filter).toArray();
      console.log(room);
      return res.send(result);
    });

    app.get("/description", async (req, res) => {
      const result = await userReviueCollection.find().toArray();
      return res.send(result);
      // console.log(room);
    });

    // conditional user can comment if book data then he or she can comment
    app.get("/bookingRoomsCount", async (req, res) => {
      const count = await userBookerDCollerction.estimatedDocumentCount();
      return res.send({ count });
    });
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
   
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hottle is running...");
});

app.listen(port, () => {
  console.log(`Hottle booking server is Running on port ${port}`);
});
