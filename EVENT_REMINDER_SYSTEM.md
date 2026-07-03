# Event Reminder Email System

## 🔧 How It Works

### Automatic Reminders (Scheduled)

- **Runs daily at 9:00 AM** (configurable in `reminderService.js`)
- Checks for events happening tomorrow
- Sends reminder emails to all registered participants
- Logs success/failure for each email

### Manual Reminders (Organizer/Admin)

- Organizers can send reminders anytime for their events
- Admins can send reminders for any event
- Admins can manually trigger tomorrow's reminders

---

## 📧 Email Features

Reminder emails include:

- 🔔 Event name and description
- 📅 Formatted date and time
- 📍 Venue information
- 🔗 Direct link to event details page
- ⏰ "Don't forget" reminder message

---

## 🚀 API Endpoints

### 1. Send Reminder for Specific Event

```http
POST /api/reminders/event/:eventId
Authorization: Required (Organizer or Admin)
```

**Response:**

```json
{
  "msg": "Reminder emails sent",
  "sent": 15,
  "failed": 0,
  "failedEmails": [],
  "totalParticipants": 15
}
```

### 2. Trigger Tomorrow's Reminders (Manual)

```http
POST /api/reminders/trigger-tomorrow
Authorization: Required (Admin only)
```

---

## ⏰ Scheduling Configuration

Edit `backend/utils/reminderService.js` to change the schedule:

```javascript
// Current: Every day at 9:00 AM
cron.schedule("0 9 * * *", () => {
  sendTomorrowReminders();
});

// Examples:
// Every day at 6:00 PM: '0 18 * * *'
// Every day at 8:00 AM and 8:00 PM: '0 8,20 * * *'
// Every hour: '0 * * * *'
```

**Cron Format:** `minute hour day month weekday`

- `0 9 * * *` = 9:00 AM every day
- `0 18 * * *` = 6:00 PM every day
- `30 8 * * *` = 8:30 AM every day

**Timezone:** Set in `reminderService.js`:

```javascript
timezone: "Asia/Kolkata"; // Change to your timezone
```

---

## 🧪 Testing the System

### Test Automatic Reminders

1. **Create a test event for tomorrow:**
   - Set the date to tomorrow's date
   - Register some participants

2. **Wait for scheduled time (9 AM)** OR **Manually trigger:**

   ```bash
   # Using curl or Postman (Admin login required)
   POST http://localhost:5000/api/reminders/trigger-tomorrow
   ```

3. **Check console logs** for confirmation:

   ```
   🔍 Checking for events happening tomorrow...
   📧 Found 1 event(s) happening tomorrow
   📬 Sending reminders to 5 participant(s) for: Tech Workshop
   ✅ Event: Tech Workshop - Sent: 5, Failed: 0
   ```

4. **Check participant emails** - they should receive reminder emails

### Test Manual Reminders (Organizer)

1. **Login as organizer** who created an event
2. **Use the frontend button** "Send Reminder" (we'll add this next)
3. OR **Use API directly:**
   ```bash
   POST http://localhost:5000/api/reminders/event/EVENT_ID_HERE
   ```

---

## 🎨 Frontend Integration

"Send Reminder" button in the organizer's event management page:

```javascript
const sendReminder = async (eventId) => {
  try {
    const res = await axios.post(
      `${BASE}/api/reminders/event/${eventId}`,
      {},
      { withCredentials: true },
    );
    toast.success(`Reminder sent to ${res.data.sent} participants!`);
  } catch (err) {
    toast.error("Failed to send reminder");
  }
};

// In JSX:
<button onClick={() => sendReminder(event._id)}>
  📧 Send Reminder to Participants
</button>;
```

---

## 📋 Email Template Preview

```
🔔 Reminder: Tech Workshop is Tomorrow!

Hi John Doe! 👋

This is a friendly reminder that you have an event coming up tomorrow!

┌─────────────────────────────────┐
│ Tech Workshop                    │
│ 📅 Date: Monday, October 31, 2025│
│ 🕒 Time: 02:00 PM               │
│ 📍 Venue: Computer Lab A        │
└─────────────────────────────────┘

⏰ Don't forget! Make sure to arrive on time.

[View Event Details]
```

---
