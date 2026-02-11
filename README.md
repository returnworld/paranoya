# Paranoya Application

A Node.js application that logs visitor information including IP address, geolocation, and visit times.

## Features

- Logs visitor IP addresses with timestamps
- Retrieves geolocation data based on IP address
- Stores visitor data in MongoDB
- Provides statistics about visitors
- Simple REST API endpoints

## Requirements

- Node.js (v14 or higher)
- MongoDB (local instance or cloud service)

## Installation

1. Clone the repository or create the project files
2. Install dependencies:

```bash
npm install
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
MONGODB_URI=mongodb://localhost:27017/paranoya
PORT=3000
```

For MongoDB Atlas, use:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/paranoya
```

## Usage

Start the application:

```bash
# Production mode
npm start

# Development mode with nodemon
npm run dev
```

## API Endpoints

### GET `/`
Logs the visitor's IP address, geolocation, and visit time.
Returns visitor information including IP, first visit, last visit, and geolocation data.
Serves a welcome page for browser access.

### GET `/stats`
Serves the HTML page with visitor statistics dashboard.

### GET `/api/stats`
Returns statistics about all visitors as JSON.
Includes total records, unique visitors, and detailed visitor information sorted by last visit.

### GET `/health`
Returns health status of the application.

### GET `/health`
Returns health status of the application.

## Data Model

The application stores visitor information in a MongoDB collection with the following schema:

- **ip**: Visitor's IP address
- **firstVisit**: Timestamp of first visit
- **lastVisit**: Timestamp of most recent visit
- **geolocation**: Object containing:
  - country: Country name
  - city: City name
  - region: Region/state
  - latitude: Latitude coordinates
  - longitude: Longitude coordinates
  - timezone: Timezone
  - isp: Internet Service Provider

## Geolocation Implementation

The application uses a local ip-location library to retrieve geolocation data based on IP addresses. This approach eliminates dependency on external APIs and provides better reliability and performance.

If the geolocation lookup fails, the application will still log the visit with null geolocation data.

## Contributing

Feel free to submit issues and enhancement requests!