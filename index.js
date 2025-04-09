const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const AuthRouter = require('./Routes/AuthRouter');
const admin_route = require('./Routes/Adminroute');
const user_route = require('./Routes/Userroute');


require('dotenv').config();
require('./Models/db');
const PORT = process.env.PORT || 8080;

app.get('/ping', (req, res) => {
    res.send('PONG');
});

app.use(bodyParser.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(cors(
    {
        origin:[
            "http://localhost:5173",
            "http://localhost:5174",
            "https://melbet.oracleapi.net",
            "https://ggwiwigames.onrender.com",
            "*",
          ], // Specify the allowed origin
        methods: ["GET", "POST", "PUT", "DELETE","PATCH","OPTIONS"], // Specify allowed methods
        allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
        credentials: true, // Allow credentials (cookies, etc.)
        optionsSuccessStatus:200,
      }
));
app.use(express.static("public"))
app.use('/auth', AuthRouter);
app.use("/admin",admin_route);
app.use("/user",user_route);
app.get("/",(req,res)=>{
    res.send("hello unibethub backend part!")
})
app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`)
})