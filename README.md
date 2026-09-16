# Radio Javan Downloader

A Telegram bot for downloading media from Radio Javan

## Features

Currently, this bot supports downloading:

- Tracks
- Podcasts
- Videos

## Run

### From Source

- Install [Node.js](https://nodejs.org/en/download) and [MongoDB](https://www.mongodb.com/try/download/community) on your machine
- Clone the repository

```bash
git clone https://github.com/alirezabaratian/rj-dl.git
```

- Install dependencies with npm

```bash
npm install
```

- Copy `.env.example` as `.env`

```bash
cp .env.example .env
```

- Define your own variables in `env`
- Run

```bash
npm start
```

### Docker

Make sure you have Docker installed on your machine. You can use [the official script](https://github.com/docker/docker-install) to install Docker.

*At the moment, you also need to have a MongoDB server running.*

- Clone the repository

```bash
git clone https://github.com/alirezabaratian/rj-dl.git
```

- Copy `.env.example` as `.env`

```bash
cp .env.example .env
```

- Define your variables in `env`
- Run

```bash
docker run --name rj-dl --network host --env-file .env alirbara/rj-dl:latest
```
