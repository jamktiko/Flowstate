# Flowstate

To help you stay on that flowstate

## Description

A full-stack task management application built with Angular and Node.js / Express, designed to help users organize their work through boards, lists, and tasks — with calendar integration, deadline notifications, and multi-platform support.

## Features

### Task & Board Organization

Users can create **Boards** containing **Lists**, each holding individual **Tasks**. Tasks support rich metadata including a title, description, due date, priority level, and tag labels. Lists and tasks can be freely reordered via drag-and-drop, making it easy to manage workflows visually.

### Calendar View

A built-in calendar displays all tasks with due dates in one place. Tasks can be added directly to the calendar or imported from **Outlook** and **Google** , keeping external schedules in sync. Any changes made to tasks are reflected in the calendar immediately.

### Push Notifications

Users receive deadline reminders via browser push notifications. Notifications can be toggled in settings with a configurable lead time.

### PWA Support

Flowstate is installable as a Progressive Web App on Android and iOS (Safari, add to home screen). Works offline for cached content.

### Authentication

Secure user authentication via AWS Cognito with registration, login, and account management.

## Getting Started

### Dependencies

- Node.js 22+
- npm
- Angular CLI
- MongoDB Atlas account
- AWS Cognito User Pool

### Installing

Clone the repository and install dependencies for both backend and frontend.

**Backend:**

    cd backend
    npm install

Create a `.env` file in the backend root with:

    MONGO_URI=your_mongodb_connection_string
    COGNITO_USER_POOL_ID=your_pool_id
    COGNITO_CLIENT_ID=your_client_id
    COGNITO_REGION=eu-north-1
    TOKEN_ENCRYPTION_KEY=64_char_hex_string
    FRONTEND_URL=http://localhost:4200
    VAPID_PUBLIC_KEY=your_vapid_public_key
    VAPID_PRIVATE_KEY=your_vapid_private_key
    VAPID_SUBJECT=mailto:your@email.com
    PORT=8080

**Frontend:**

    cd frontend
    npm install

### Executing program

**Backend:**

    cd backend
    npm run dev

**Frontend:**

    cd frontend
    ng serve

Frontend runs at http://localhost:4200

Backend runs at http://localhost:8080

Health check: GET http://localhost:8080/api/health

## Help

Any advise for common problems or issues.

```
command to run if program contains helper info
```

## Authors

- Jeremia Vepsäläinen — Git Manager / Project Manager
- Jani Saari — Product Owner
- Jesse Kokki — Cloud Architect
- Annika Järvinen — Scrum Master

## Version History

- 1.0
  - Full stack release — boards, tasks, calendar sync, push notifications, PWA

## License

This project is licensed under the CC BY-SA 4.0 License - see the LICENSE.md file for details

[![CC BY-SA 4.0][cc-by-sa-image]][cc-by-sa]

[cc-by-sa]: http://creativecommons.org/licenses/by-sa/4.0/
[cc-by-sa-image]: https://licensebuttons.net/l/by-sa/4.0/88x31.png

## Acknowledgments

- Built with Angular, Node.js, Express, MongoDB, AWS Cognito
- Push notifications via Web Push API (VAPID)
- Calendar integration via Google Calendar API
