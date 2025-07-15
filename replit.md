# Flow - Invoice Nudge Automation

## Overview

Flow is a minimalist SaaS application that automates invoice follow-up emails ("nudges") for business owners. Instead of manually reminding clients to pay invoices, Flow sends intelligent, scheduled nudges to help businesses get paid faster. The system features a freemium model with basic functionality for free users and enhanced features for Pro subscribers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query for server state and React hooks for local state
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js 18 with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and express-session
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Email Service**: Nodemailer with SMTP configuration
- **Payment Processing**: Stripe for subscription management
- **Scheduling**: node-cron for automated nudge processing

### Project Structure
```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared TypeScript types and schemas
└── migrations/      # Database migrations
```

## Key Components

### Authentication System
- Email/password authentication using Passport.js
- Session-based authentication with secure cookies
- Email confirmation workflow
- Password reset functionality
- Protected routes with authentication middleware

### Invoice Management
- CRUD operations for invoices
- Invoice status tracking (pending, paid, overdue)
- Automatic overdue detection based on due dates
- Manual payment marking
- Client information management

### Nudge Automation
- Automated email scheduling using cron jobs
- Intelligent nudge timing based on days overdue
- Customizable message tones (friendly, firm)
- Nudge frequency limits (3 for free, 5 for Pro)
- Nudge history tracking

### Subscription Management
- Stripe integration for payment processing
- Free tier with limited features (3 active invoices)
- Pro tier with enhanced features (unlimited invoices, more nudges)
- Subscription status tracking and management

### Database Schema
- Users table with business information and preferences
- Invoices table with client details and payment tracking
- Subscriptions table for Stripe integration
- Nudge logs for tracking email history
- Email templates for customizable messaging

## Data Flow

### Invoice Processing Flow
1. User creates invoice with client details and due date
2. System monitors due dates via cron job
3. Overdue invoices trigger nudge generation
4. Email service sends nudge to client
5. System tracks nudge history and updates counters
6. User can manually mark invoices as paid

### Authentication Flow
1. User signs up with email/password
2. System sends confirmation email
3. User confirms email to activate account
4. Login creates secure session
5. Protected routes verify authentication status

### Subscription Flow
1. User upgrades to Pro via Stripe checkout
2. Webhook updates user subscription status
3. System enables Pro features (unlimited invoices, more nudges)
4. Subscription status monitored for renewals/cancellations

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Database ORM and query builder
- **stripe**: Payment processing and subscription management
- **nodemailer**: Email sending capabilities
- **bcrypt**: Password hashing
- **node-cron**: Automated task scheduling

### Frontend Dependencies
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: UI component primitives
- **@stripe/stripe-js**: Stripe payment integration
- **wouter**: Client-side routing
- **tailwindcss**: Utility-first CSS framework

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **esbuild**: Server-side bundling for production

## Deployment Strategy

### Build Process
- Frontend: Vite builds React app to `dist/public`
- Backend: esbuild bundles server code to `dist/index.js`
- Database: Drizzle handles schema migrations

### Production Configuration
- Environment variables for database, SMTP, and Stripe
- Session secrets for authentication security
- Database connection pooling with Neon
- Static file serving for built frontend

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `STRIPE_SECRET_KEY`: Stripe API key
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`: Email configuration
- `SESSION_SECRET`: Session encryption key
- `APP_URL`: Application base URL for email links

### Deployment Features
- Railway-ready configuration
- Production-optimized builds
- Database migration support
- Health check endpoints
- Error handling and logging

The application follows a traditional client-server architecture with clear separation of concerns, making it maintainable and scalable for a SaaS business model.