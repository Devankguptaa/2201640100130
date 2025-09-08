const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const { Logger, requestLogger, errorLogger } = require("../../Logging Middleware/index.js");
const routes = require("./routes");

const app = express();
app.use(express.json());

const logger = new Logger({ baseUrl: process.env.LOG_BASE_URL, token: process.env.LOG_TOKEN });

app.use(requestLogger(logger, "url-shortener"));

const port = process.env.PORT || 3000;
const hostBase = process.env.HOST_BASE_URL || `http://localhost:${port}`;

app.use("/", routes(logger, hostBase));

app.use(errorLogger(logger, "url-shortener"));

app.listen(port, () => console.log(`URL Shortener running at ${hostBase}`));
