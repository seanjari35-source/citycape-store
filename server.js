const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Use environment variables for security
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'AC865402ad4702587cc3dacc';
const authToken = process.env.TWILIO_AUTH_TOKEN || '892134a7e2d69bacb23c046309';
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

const client = twilio(accountSid, authToken);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve a basic dashboard interface
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Citycape store -notification</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 40px; background-color: #f4f7f6; }
                .card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); display: inline-block; max-width: 400px; width: 100%; }
                h1 { color: #333; }
                input, button { width: 100%; padding: 12px; margin: 10px 0; border-radius: 4px; border: 1px solid #ccc; box-sizing: border-box; }
                button { background-color: #25D366; color: white; border: none; font-size: 16px; cursor: pointer; font-weight: bold; }
                button:hover { background-color: #128C7E; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>Citycapestore</h1>
                <p>Send WhatsApp Notification Hub</p>
                <form action="/send-notification" method="POST">
                    <input type="text" name="phone" placeholder="e.g. +254700000000" required />
                    <input type="text" name="message" placeholder="Type your notification message..." required />
                    <button type="submit">Send Notification</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// Route to handle sending the WhatsApp message
app.post('/send-notification', (req, res) => {
    const { phone, message } = req.body;
    
    // Ensure phone number format has whatsapp: prefix
    const formattedTo = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`;

    client.messages.create({
        from: whatsappFrom,
        to: formattedTo,
        body: message
    })
    .then(msg => {
        res.send(`<h2>Notification sent successfully! SID: ${msg.sid}</h2><br><a href="/">Go Back</a>`);
    })
    .catch(err => {
        res.status(500).send(`<h2>Failed to send notification: ${err.message}</h2><br><a href="/">Go Back</a>`);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
