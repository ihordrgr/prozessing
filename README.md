# VIP Club Access System

A complete VIP access system with a beautiful landing page and Telegram bot for payment processing.

## Features

### Frontend
- 🎨 Modern, responsive landing page
- ⚡ Fast loading with optimized assets
- 📱 Mobile-first design
- 🔒 Secure payment integration
- 🎯 High conversion rate optimization

### Backend (Telegram Bot)
- 🤖 Advanced Telegram bot with payment processing
- 💳 Multiple payment method support
- 📸 Screenshot verification system
- 🔐 Secure access link generation
- 📊 User analytics and logging
- 🚀 Scalable architecture

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Telegram Bot Token (from @BotFather)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vip-access-system
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the services**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost
   - Bot: Start your Telegram bot

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Required
BOT_TOKEN=your_telegram_bot_token

# Optional
WEBHOOK_URL=https://yourdomain.com/webhook
ADMIN_CHAT_ID=your_admin_chat_id
DATABASE_URL=postgresql://user:pass@db:5432/vip_club
```

### Telegram Bot Setup

1. Create a bot with @BotFather
2. Get your bot token
3. Set the token in your `.env` file
4. Start the bot service

## Architecture

```
project/
├── backend/           # Telegram bot service
│   ├── main.py       # Main bot application
│   ├── utils.py      # Utility functions
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/         # Landing page
│   ├── index.html    # Main page
│   ├── nginx.conf    # Nginx configuration
│   └── Dockerfile
├── docker-compose.yml # Service orchestration
└── .env.example      # Environment template
```

## Services

### Frontend Service
- **Port**: 80
- **Technology**: Static HTML with advanced CSS/JS
- **Features**: Responsive design, animations, SEO optimization

### Backend Service (Bot)
- **Technology**: Python + aiogram
- **Features**: Payment processing, user management, access control

### Redis Service
- **Purpose**: Caching and session storage
- **Port**: 6379 (internal)

### Database Service (Optional)
- **Technology**: PostgreSQL
- **Purpose**: User data and payment records

## Development

### Local Development

1. **Frontend development**
   ```bash
   cd frontend
   python -m http.server 8000
   ```

2. **Backend development**
   ```bash
   cd backend
   pip install -r requirements.txt
   python main.py
   ```

### Production Deployment

1. **Configure domain and SSL**
   ```bash
   # Update nginx configuration
   # Add SSL certificates
   ```

2. **Deploy with production profile**
   ```bash
   docker-compose --profile production up -d
   ```

## Payment Integration

The system supports multiple payment methods:

- 💳 Bank cards
- 🏦 SBP (Fast Payment System)
- ₿ Cryptocurrency
- 💰 E-wallets

### Adding Payment Providers

1. Update `backend/utils.py`
2. Add provider-specific verification logic
3. Configure environment variables

## Security Features

- 🔒 Input validation and sanitization
- 🛡️ Rate limiting
- 🔐 Secure token generation
- 📝 Audit logging
- 🚫 XSS and CSRF protection

## Monitoring

### Health Checks
All services include health checks:
- Frontend: HTTP endpoint check
- Backend: Bot status verification
- Database: Connection test
- Redis: Ping test

### Logging
- Structured logging with levels
- User action tracking
- Error monitoring
- Performance metrics

## Customization

### Styling
Edit `frontend/index.html` to customize:
- Colors and themes
- Layout and components
- Animations and effects

### Bot Messages
Edit `backend/main.py` to customize:
- Welcome messages
- Payment instructions
- Success/error messages

### Payment Flow
Edit `backend/utils.py` to customize:
- Payment verification logic
- Access link generation
- User management

## Troubleshooting

### Common Issues

1. **Bot not responding**
   - Check bot token
   - Verify network connectivity
   - Check logs: `docker-compose logs backend`

2. **Frontend not loading**
   - Check port availability
   - Verify nginx configuration
   - Check logs: `docker-compose logs frontend`

3. **Database connection issues**
   - Verify database credentials
   - Check network connectivity
   - Check logs: `docker-compose logs database`

### Debug Mode

Enable debug mode:
```bash
export DEBUG=true
docker-compose up
```

## Support

For support and questions:
- 📧 Email: support@vip-club.com
- 💬 Telegram: @support_bot
- 📖 Documentation: [docs.vip-club.com]

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

**Made with ❤️ for VIP Club Access System**