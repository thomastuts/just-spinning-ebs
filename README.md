# Just Spinning EBS

## Getting started
This project runs on Node.js, so install that first!

### Dependencies
Run `npm install` to install all dependencies.

### Database
This project requires a PostgreSQL database. Provision one, and then
add the connection string to the `.env` file (see below).

Once you have your database, you'll need to run the migrations to create the necessary tables. Run
`npx knex migrate:latest` in your terminal (this requires the `.env` file to be created, again, see below).

### Pusher
To communicate with the viewer (the OBS browser source), the EBS uses Pusher. Create a Pusher project and add
its details in the `.env` file.

### Running the project
Run `npm run start:dev`.

### `.env` file
Locally, you'll store your environment variables in a `.env` file. When hosting the EBS somewhere like
on Heroku, it will use the environment variables you define there. Here's an example `.env` file:

```dotenv
# Server configuration
PORT=9999

# Twitch API credentials
TWITCH_EXTENSION_OWNER_ID=XXXX
TWITCH_API_CLIENT_ID=XXXX
TWITCH_API_CLIENT_SECRET=XXXX
TWITCH_EXTENSION_SECRET=XXXX
TWITCH_EVENTSUB_CALLBACK_URL=https://localhost:9999/eventsub
TWITCH_EVENTSUB_SECRET=XXXX

# Pusher configuration
PUSHER_APP_ID=XXXX
PUSHER_KEY=XXXX
PUSHER_SECRET=XXXX

# Database configuration
DATABASE_URL=postgres://username:password@hostname:5432/database_name
```
