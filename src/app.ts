import express from "express";
import { router } from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { HttpError } from "./utils/httpError";

const app = express();
app.use(express.json());
app.use(router);
app.use((req, _res, next) => next(new HttpError(404, "Not Found")));
app.use(errorHandler);

export { app };
