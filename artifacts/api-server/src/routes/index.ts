import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import employeesRouter from "./employees";
import departmentsRouter from "./departments";
import attendanceRouter from "./attendance";
import leavesRouter from "./leaves";
import schedulesRouter from "./schedules";
import payrollRouter from "./payroll";
import requestsRouter from "./requests";
import assetsRouter from "./assets";
import locationsRouter from "./locations";
import workDocsRouter from "./work-docs";
import imagesRouter from "./images";
import maintenanceRouter from "./maintenance";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(maintenanceRouter);
router.use(aiRouter);
router.use(authRouter);
router.use(dashboardRouter);
router.use(employeesRouter);
router.use(departmentsRouter);
router.use(attendanceRouter);
router.use(leavesRouter);
router.use(schedulesRouter);
router.use(payrollRouter);
router.use(requestsRouter);
router.use(assetsRouter);
router.use(locationsRouter);
router.use(workDocsRouter);
router.use(imagesRouter);

export default router;
