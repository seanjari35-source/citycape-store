const express = require('express');
const twilio = require('twilio');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// This makes a beautiful homepage visible to the entire world!
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; text-align: center; margin-top: 100px;">
            <h1 style="color: #2b6cb0; font-size: 3rem;">Welcome to Citycape Store! 🚀</h1>
            <p style="color: #4a5568; font-size: 1.2rem;">Our automated WhatsApp systems are fully active worldwide.</p>
            <div style="display: inline-block; background: #48bb78; color: white; padding: 10px 20px; border-radius: 5px; margin-top: 20px; font-weight: bold;">
                System Status: ONLINE
            </div>
        </div>
    `);
});
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'AC865402ad4702587cc3dacc31343d09d2';
const authToken = process.env.TWILIO_AUTH_TOKEN || '892134a7e2d69bacb23c0463095ca45f';
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

const client = twilio(accountSid, authToken);

app.get('/send-reminder', async (req, res) => {
    try {
        const message = await client.messages.create({
            from: whatsappFrom,
            to: 'whatsapp:+254701237616', 
            contentSid: 'HXb5993a404983fb0dc6ea42a1ebed6034',
            contentVariables: JSON.stringify({ "1": "12/1 at 3pm" })
        });
        console.log('Automated message sent! SID:', message.sid);
        res.send('🚀 Reminder message sent successfully!');
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).send('Failed to send message: ' + error.message);
    }
});

app.post('/webhook', (req, res) => {
    const incomingData = req.body;
    const buttonText = incomingData.ButtonText;

    console.log(`User interacted with button: "${buttonText}"`);

    const twiml = new twilio.twiml.MessagingResponse();

    if (buttonText === 'Confirm') {
        twiml.message('✅ Thank you! Your appointment has been successfully confirmed.');
    } else if (buttonText === 'Cancel') {
        twiml.message('❌ No problem. Your appointment has been cancelled.');
    } else {
        twiml.message('Hello! Please use the buttons on the card to respond.');
    }

    res.type('text/xml').send(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`⚡ Server running perfectly on port ${PORT}`);
});
