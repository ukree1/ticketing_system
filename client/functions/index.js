const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const nodemailer = require("nodemailer");

const GMAIL_APP_PASSWORD = defineSecret("GMAIL_APP_PASSWORD");
const OWNER_EMAIL = "jersontagulao11@gmail.com";

// IMPORTANT: this should match your Firestore database location
// (Firebase Console > Firestore Database > Data tab shows it, e.g. "asia-southeast1").
// If your database is in another region, change this value.
const REGION = "us-central1";

exports.sendContactEmail = onDocumentCreated(
  { document: "contactMessages/{id}", region: REGION, secrets: [GMAIL_APP_PASSWORD] },
  async (event) => {
    const d = event.data?.data();
    if (!d) {
      logger.warn("No data on new contact message", { id: event.params.id });
      return;
    }
    logger.info("New contact message received", { id: event.params.id });

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: OWNER_EMAIL, pass: GMAIL_APP_PASSWORD.value() },
      });

      const info = await transporter.sendMail({
        from: `"Fabre Ticketing System" <${OWNER_EMAIL}>`,
        to: OWNER_EMAIL,
        replyTo: d.email,
        subject: `[Fabre Contact] ${d.subject}`,
        text: `Name: ${d.name}\nEmail: ${d.email}\nSubject: ${d.subject}\n\n${d.message}`,
      });
      logger.info("Email sent", { messageId: info.messageId });
    } catch (err) {
      logger.error("Email failed", err);
      throw err;
    }
  }
);