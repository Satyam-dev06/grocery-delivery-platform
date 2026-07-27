const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getNotifications, getUnreadCount, createNotif,
  markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications,
} = require("../controllers/notificationController");

router.use(protect);

router.get("/", getNotifications);
router.get("/unread", getUnreadCount);
router.post("/", createNotif);
router.put("/read/:id", markAsRead);
router.put("/read-all", markAllAsRead);
router.delete("/:id", deleteNotification);
router.delete("/", deleteAllNotifications);

module.exports = router;
