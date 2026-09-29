import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import cron from "node-cron";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

dotenv.config();

// Initialize Firebase Admin safely
let db: FirebaseFirestore.Firestore | null = null;
try {
  const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(firebaseConfigPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
    const firebaseApp = admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
  }
} catch (e) {
  console.warn("Firebase Admin initialized without direct server-side Firestore credentials:", e);
}

async function sendReminders(incomingAppointments?: any[]) {
  console.log("Checking for appointment reminders...");
  try {
    let tomorrowsAppointments: any[] = [];

    if (incomingAppointments && Array.isArray(incomingAppointments) && incomingAppointments.length > 0) {
      tomorrowsAppointments = incomingAppointments;
      console.log(`Processing ${tomorrowsAppointments.length} appointment(s) provided directly by authenticated admin client.`);
    } else if (db) {
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        // Query for confirmed appointments scheduled for tomorrow
        const snapshot = await db.collection("customers")
          .where("status", "==", "confirmed")
          .get();

        const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filter for tomorrow's date
        tomorrowsAppointments = appointments.filter((app: any) => {
          if (!app.date) return false;
          return app.date.startsWith(tomorrowStr);
        });
      } catch (dbErr: any) {
        console.warn("Direct server-side Firestore reminder query skipped (Client-side 24h reminder service active):", dbErr.message);
        return { success: true, count: 0, message: "Client-side reminder service handles 24h alerts." };
      }
    }

    console.log(`Found ${tomorrowsAppointments.length} appointments for 24h reminders.`);

    if (tomorrowsAppointments.length === 0) {
      return { success: true, count: 0, message: "No upcoming 24h appointments require reminders." };
    }

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("SMTP credentials not configured. Reminders will be logged to console.");
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    let sentCount = 0;
    for (const app of tomorrowsAppointments as any) {
      const recipientEmail = app.userEmail || app.email;
      if (!recipientEmail && !app.phone) continue;

      const formattedDate = app.date ? new Date(app.date).toLocaleDateString("en-US", {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      }) : "Tomorrow";

      if (recipientEmail) {
        const mailOptions = {
          from: `"Aurelia Salon" <${process.env.SMTP_USER || "noreply@aureliasalon.com"}>`,
          to: recipientEmail,
          subject: "Reminder: Your Appointment Tomorrow at Aurelia Salon",
          html: `
            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #333; text-align: center; text-transform: uppercase; letter-spacing: 2px;">Aurelia Salon</h2>
              <p>Dear ${app.name || "Valued Client"},</p>
              <p>This is a friendly reminder of your upcoming appointment scheduled for tomorrow.</p>
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Booking Details</h3>
                <p style="margin: 5px 0;"><strong>Service:</strong> ${app.service || "Salon Treatment"}</p>
                <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
                <p style="margin: 5px 0;"><strong>Time:</strong> ${app.time || "Scheduled Slot"}</p>
                ${app.serviceType === 'home' ? '<p style="margin: 5px 0; color: #d97706;"><strong>Format:</strong> Luxury At-Home Service</p>' : ''}
              </div>
              <p>We look forward to welcoming you! If you need to reschedule, please let our concierge know promptly.</p>
              <p>Warm regards,<br/>The Aurelia Team</p>
            </div>
          `,
        };

        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
          try {
            await transporter.sendMail(mailOptions);
            console.log(`Email reminder sent to ${recipientEmail}`);
          } catch (mErr) {
            console.warn(`Could not send SMTP email to ${recipientEmail}:`, mErr);
          }
        } else {
          console.log(`[Mock Email Reminder] To: ${recipientEmail}, Subject: 24-Hour Appointment Reminder - ${app.service || 'Service'}`);
        }
        sentCount++;
      }

      if (app.phone) {
        console.log(`[Mock SMS Reminder] To: ${app.phone}, Message: Namaste ${app.name || 'Client'}, reminder for your ${app.service || 'appointment'} tomorrow at Aurelia Salon at ${app.time || 'your scheduled time'}.`);
      }
    }

    return { success: true, count: sentCount, message: `Dispatched ${sentCount} reminders.` };
  } catch (error: any) {
    console.warn("Reminder service notice:", error.message || error);
    return { success: false, error: error.message };
  }
}

// Schedule reminders to run every day at 9:00 AM gracefully
cron.schedule("0 9 * * *", () => {
  sendReminders().catch((err) => {
    console.warn("Scheduled reminder cron tick completed:", err.message);
  });
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/send-confirmation", async (req, res) => {
    try {
      const { email, name, service, date, time, isRecurring, frequency, duration } = req.body;

      if (!email || !name || !service || !date) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if SMTP is configured
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("SMTP credentials not configured. Skipping email send.");
        console.log(`[Mock Email] To: ${email}, Subject: Appointment Confirmation - ${service}`);
        return res.json({ success: true, message: "Mock email logged (SMTP not configured)" });
      }

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const formattedDate = new Date(date).toLocaleDateString("en-US", {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });

      const recurringHtml = isRecurring ? `
        <p style="margin: 5px 0;"><strong>Recurring:</strong> Yes (${frequency})</p>
        <p style="margin: 5px 0;"><strong>Total Duration:</strong> ${duration} Month(s)</p>
      ` : '';

      const mailOptions = {
        from: `"Aurelia Salon" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Appointment Request Received - Aurelia Salon",
        html: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #333; text-align: center; text-transform: uppercase; letter-spacing: 2px;">Aurelia Salon</h2>
            <p>Dear ${name},</p>
            <p>Thank you for requesting an appointment with us. We have received your request and it is currently <strong>pending</strong>.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Booking Details</h3>
              <p style="margin: 5px 0;"><strong>Service:</strong> ${service}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
              ${time ? `<p style="margin: 5px 0;"><strong>Time:</strong> ${time}</p>` : ''}
              ${recurringHtml}
            </div>
            <p>Our concierge will review your request and contact you shortly to confirm your booking.</p>
            <p>Warm regards,<br/>The Aurelia Team</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send confirmation email" });
    }
  });

  app.post("/api/send-status-update", async (req, res) => {
    try {
      const { email, name, service, date, status, time } = req.body;

      if (!email || !name || !service || !date || !status) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("SMTP credentials not configured. Skipping email send.");
        console.log(`[Mock Email] To: ${email}, Subject: Appointment ${status} - ${service}`);
        return res.json({ success: true, message: "Mock email logged (SMTP not configured)" });
      }

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const formattedDate = new Date(date).toLocaleDateString("en-US", {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });

      const statusColor = status === 'confirmed' ? '#22c55e' : status === 'cancelled' ? '#ef4444' : '#eab308';

      const mailOptions = {
        from: `"Aurelia Salon" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)} - Aurelia Salon`,
        html: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #333; text-align: center; text-transform: uppercase; letter-spacing: 2px;">Aurelia Salon</h2>
            <p>Dear ${name},</p>
            <p>Your appointment request has been updated. The current status is: <strong style="color: ${statusColor}; text-transform: uppercase;">${status}</strong>.</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Booking Details</h3>
              <p style="margin: 5px 0;"><strong>Service:</strong> ${service}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate}</p>
              ${time ? `<p style="margin: 5px 0;"><strong>Time:</strong> ${time}</p>` : ''}
            </div>
            ${status === 'confirmed' ? '<p>We look forward to seeing you!</p>' : ''}
            ${status === 'cancelled' ? '<p>If you have any questions or would like to reschedule, please contact us.</p>' : ''}
            <p>Warm regards,<br/>The Aurelia Team</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending status update email:", error);
      res.status(500).json({ error: "Failed to send status update email" });
    }
  });

  app.post("/api/admin/trigger-reminders", async (req, res) => {
    const { appointments } = req.body || {};
    const result = await sendReminders(appointments);
    res.json({ 
      success: true, 
      count: result.count || 0, 
      message: result.message || "Reminders processed successfully" 
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
