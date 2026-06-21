const express = require('express');
const twilio = require('twilio');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'AC865402ad4702587cc3dacc31343d09d2';
const authToken = process.env.TWILIO_AUTH_TOKEN || '892134a7e2d69bacb23c0463095ca45f';
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

const client = twilio(accountSid, authToken);


    res.send('<h1>System Status: Live 🚀</h1>');
});

app.get('/send-reminder', async (req, res) => {
    try {
        const message = await client.messages.create({
            from: whatsappFrom,
            to: 'whatsapp:+254758509154',
            body: 'Hello from Citycape Store! Your automated reminder system is officially live.'
        });

        console.log('Automated message sent! SID:', message.sid);
        res.send('🚀 Reminder message sent successfully!');
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).send('Failed to send message: ' + error.message);
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server running perfectly on port ${PORT}`);
});
