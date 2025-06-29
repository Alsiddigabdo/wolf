const express = require("express");
const http = require("http");
const path = require("path");
const multer = require("multer");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const compression = require("compression");
const minify = require("express-minify");
const cron = require("node-cron");
const NotificationModel = require("./models/NotificationModel");
const logger = require("./config/logger");
const expressStatusMonitor = require("express-status-monitor");

const { createCloudinaryStorage } = require("./config/cloudinaryConfig");

// الراوترات
const userRouter = require("./router/UsersRouter");
const forumRouter = require("./router/forumRoutes");
const MessagesProjectRoutes = require("./router/messagesProjectRoutes");
const friendshipRoutes = require("./routes/friends");
const notificationRouter = require("./router/notificationRoutes");
const chatRoutes = require("./router/chatRoutes");
const jobRoutes = require("./router/jobRoutes");
const profileRouter = require("./router/profileRouter");
const ProjectRoutes = require("./router/ProjectRoutes");
const contactRoutes = require("./router/contactRoutes");
const adminMessageRoutes = require("./router/adminMessageRoutes");
const adminDashboardRoutes = require("./router/adminDashboardRoutes");
const adminStatisticsRoutes = require("./router/adminStatisticsRoutes");
const adminSiteStatsRoutes = require("./router/adminSiteStatsRoutes");
const adminRolesPermissionsRoutes = require("./router/adminRolesPermissionsRoutes");
const adminForumSettingsRoutes = require("./router/adminForumSettingsRoutes");
const adminJobProjectSettingsRoutes = require("./router/adminJobProjectSettingsRoutes");
const adminUsersRoutes = require("./router/adminUsersRoutes");
const changePasswordRoutes = require("./router/changePasswordRoutes");
const storeRoutes = require("./router/StoreRoutes");

const errorHandler = require("./middleware/errorHandler");
const GlobalRoleController = require("./controllers/GlobalRoleController");
const ForumController = require("./controllers/ForumController");
const dynamicMetaMiddleware = require("./middleware/dynamicMetaMiddleware");

const app = express();
const server = http.createServer(app);

// الضغط والتصغير والمراقبة
app.use(compression());
app.use(minify());
app.use(expressStatusMonitor());

// التخزين على Cloudinary
const storage = createCloudinaryStorage("general");
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// إعدادات أساسية
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: "your_jwt_secret",
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public"), {
  maxAge: "1d",
  etag: true,
}));

// ميتا
app.use(dynamicMetaMiddleware);

// unreadCount
app.use(async (req, res, next) => {
  if (req.session?.userId) {
    try {
      const unreadCount = await NotificationModel.getUnreadCount(req.session.userId);
      res.locals.unreadCount = unreadCount || 0;
    } catch (err) {
      logger.error("unreadCount error:", err);
    }
  } else {
    res.locals.unreadCount = 0;
  }
  next();
});

// دور المستخدم
app.use(GlobalRoleController.setGlobalRole);

// الصفحة الرئيسية
app.get("/", ForumController.getAllPosts);

// الراوترات
app.use("/", userRouter);
app.use("/", changePasswordRoutes);
app.use("/friends", friendshipRoutes);
app.use(notificationRouter);
app.use("/forum", forumRouter);
app.use("/", chatRoutes);
app.use("/", jobRoutes);
app.use("/", profileRouter);
app.use("/projects", ProjectRoutes);
app.use("/", MessagesProjectRoutes);
app.use("/", contactRoutes);
app.use("/stores", storeRoutes);
app.use("/admin", adminMessageRoutes);
app.use("/admin", adminDashboardRoutes);
app.use("/admin", adminStatisticsRoutes);
app.use("/admin", adminSiteStatsRoutes);
app.use("/admin", adminRolesPermissionsRoutes);
app.use("/admin", adminForumSettingsRoutes);
app.use("/admin", adminJobProjectSettingsRoutes);
app.use("/admin", adminUsersRoutes);
app.use("/", require("./router/GlobalRoleRouter"));

// صفحات ثابتة
app.get("/about", (req, res) => {
  res.locals.pageName = "about";
  res.render("about", {
    unreadCount: res.locals.unreadCount,
    userId: res.locals.userId,
    isAdmin: res.locals.isAdmin,
  });
});

app.get("/privacy", (req, res) => {
  res.locals.pageName = "privacy";
  res.render("privacy", {
    unreadCount: res.locals.unreadCount,
    userId: res.locals.userId,
    isAdmin: res.locals.isAdmin,
  });
});

app.get("/ProjectSpace", (req, res) => {
  res.locals.pageName = "ProjectSpace";
  res.render("ProjectSpace", {
    errorMessage: null,
    successMessage: null,
    userId: res.locals.userId,
    isAdmin: res.locals.isAdmin,
    unreadCount: res.locals.unreadCount,
  });
});

// حذف الإعلانات القديمة
cron.schedule("0 0 * * *", async () => {
  try {
    const forumModel = require("./models/forumModel");
    await forumModel.deleteOldAds();
    console.log("Old ads deleted.");
  } catch (err) {
    logger.error("Scheduled deletion error:", err);
  }
}, {
  scheduled: true,
  timezone: "Asia/Riyadh",
});

// الأخطاء
app.use(errorHandler);

// التشغيل
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
