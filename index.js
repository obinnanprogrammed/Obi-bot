// load environment variables from .env file
require('dotenv').config();

// import required packages
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

// create a new discord client (bot) with intents (specific permissions):
// - guilds: allows the bot to see server information
// - guildmessages: allows the bot to see messages in servers
// - messagecontent: allows the bot to read the content of messages
// a list of intents can be found on the discord documentation linked in the slides
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ] 
});

// this event runs once when the bot successfully connects to discord
client.once('ready', () => {
  console.log('Obi-bot is online!');
});

// this event runs every time a message is sent in a channel the bot can see
client.on('messageCreate', async (message) => {
  // ignore messages from other bots to prevent potential loops
  if (message.author.bot) return;

  // check for echo command
  if (message.content.toLowerCase().startsWith('echo')) {
    // get everything after "echo"
    const textToEcho = message.content.split('echo')[1].trim();
    
    // if there's text to echo, send it back
    if (textToEcho) {
      await message.channel.send(textToEcho);
    } else {
      await message.channel.send('What do you want me to echo?');
    }
  }

  // check for joke command
  if (message.content.toLowerCase().startsWith('hey goofball tell me a joke')) {
    try {
      // make a request to the joke api
      const response = await axios.get('https://official-joke-api.appspot.com/random_joke');
      const joke = response.data;
      
      // send the joke setup and punchline to the discord channel
      await message.channel.send(`${joke.setup}\n\n${joke.punchline}`);
    } catch (error) {
      // if something goes wrong, log the error and let the user know
      console.error('Error fetching joke:', error);
      message.channel.send('Oops! I forgot the joke!');
    }
  }

  // weather details
  if(message.content.toLowerCase().startsWith('curr-weather')) {
    const location = message.content.split('curr-weather')[1].trim();
    //console.log(location);
    if(location) {
        try {
            const res = await axios.get(`http://dataservice.accuweather.com/locations/v1/cities/search`, {
                params: {
                  apikey: process.env.ACCUWEATHER_API_KEY,
                  q: location
                }
            });

            //console.log(res.data);
            const locationKey = res.data[0]["Key"];
            console.log("Location key: ", locationKey);

            const currentWeatherRes = await axios.get(`http://dataservice.accuweather.com/currentconditions/v1/${locationKey}`, {
                params: {
                  apikey: process.env.ACCUWEATHER_API_KEY,
                  details: true, // Optional: Provides more detailed data
                },
            });

            const weather = currentWeatherRes.data[0]["WeatherText"];
            const tempImperial = currentWeatherRes.data[0]["Temperature"]["Imperial"];

            console.log(currentWeatherRes.data[0]["Wind"]["Direction"], currentWeatherRes.data[0]["Wind"]["Speed"]);
            const weatherStr = weather + ", temperature: " + tempImperial['Value'] + " deg F\nRelative Humidity: " + 
                currentWeatherRes.data[0]["RelativeHumidity"] + "%\nWind Speed: " +
                currentWeatherRes.data[0]["Wind"]["Speed"]["Imperial"]["Value"] + " mi/h " + currentWeatherRes.data[0]["Wind"]["Direction"]["English"]
                + "\nWind Chill temperature: " + 
                currentWeatherRes.data[0]["WindChillTemperature"]["Imperial"]["Value"] + " deg F";
            await message.channel.send("Current conditions:\n" + weatherStr);

        } catch(error) {
            console.error("Error executing operation: ", error.message);
        }
    } else {
        await message.channel.send('Sir, why are you asking for the weather for no place at all?');
    }
  }
});

// start the bot by logging in with the token from .env file
client.login(process.env.BOT_TOKEN);