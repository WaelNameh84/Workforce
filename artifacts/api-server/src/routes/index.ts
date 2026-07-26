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

const router: IRouter = Router();

router.use(healthRouter);
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

export default router;
