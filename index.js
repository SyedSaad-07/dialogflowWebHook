const express = require('express');
const diff = require('dialogflow-fulfillment');
const axios = require('axios');
const { SessionsClient } = require('dialogflow');
const cors = require('cors')({ origin: true });

const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');
const bodyParser = require('body-parser');

const app = express();
app.use(express.json());

// A unique identifier for the given session
const sessionId = uuid.v4();
const port = 3000;

app.get('/', (req, res) => {
    res.send("Server is now live...! ")
})

/**
 * Send a query to the dialogflow agent, and return the query result.
 * @param {string} projectId The project to be used
 */

async function runSample(msg, projectId = 'ecommmerce-daoj') {
    // Create a new session
    const sessionClient = new dialogflow.SessionsClient({
        keyFilename: "D:/ReactJS-Interview/interactCX/ecommmerce-daoj-d7a4825a8c74.json"
    });

    const sessionPath = sessionClient.projectAgentSessionPath(
        projectId,
        sessionId
    );


    // The text query request.
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                // The query to send to the dialogflow agent
                text: msg,
                // The language used by the client (en-US)
                languageCode: 'en-US',
            },
        },
    };

    // Send request and log result
    const responses = await sessionClient.detectIntent(request);
    console.log('Detected intent');
    const result = responses[0].queryResult;
    console.log(`  Query: ${result.queryText}`);
    console.log(`  Response: ${result.fulfillmentText}`);
    if (result.intent) {
        console.log(`  Intent: ${result.intent.displayName}`);
    } else {
        console.log('  No intent matched.');
    }
    return result.fulfillmentText;
}

// function to change date format
const changeDateFormat = (shipmentDate)=>{
    
    const date = new Date(shipmentDate);
    const formattedDate = date.toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC',
    });
    return formattedDate;
}

// API to handle WebRequest from dialogFlow
app.post('/webhook', async (req, res) => {

    const parameterValue = req.body.queryResult.parameters["orderId"];
    const requestBody = {
        orderId: parameterValue,
    };
    try {
        let data = await axios.post('https://orderstatusapi-dot-organization-project-311520.uc.r.appspot.com/api/getOrderStatus', requestBody)

        if (data.data.shipmentDate) {
          const formattedDate = changeDateFormat(data.data.shipmentDate);
            let response = " ";
            let responseObj = {
                "fulfillmentText": response,
                "fulfillmentMessages": [
                    {
                        "text":
                        {
                            "text": [
                                `Your Order ${parameterValue} is shipped on ${formattedDate}`
                            ]
                        }
                    }
                ],
            }
            console.log(responseObj);
            return res.send(responseObj);

        } else {

            let responseObj = {
                "fulfillmentText": response,
                "fulfillmentMessages": [
                    {
                        "text":
                        {
                            "text": [
                                `Your Order ${parameterValue} is not correct`
                            ]
                        }
                    }
                ],
            }
            console.log(responseObj);
            return res.send(responseObj);

        }
    } catch (error) {
        return res.send(error);
    }

})
// End of this API

app.post('/chatbot', (req, res) => {
    runSample(req.body.msg).then(data => {
        return res.send({ "Reply": data })
    });
})

app.listen(port, async (e) => {
    console.log(`Server running on PORT ${port}!`);
})
