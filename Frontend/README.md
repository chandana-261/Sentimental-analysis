# AI-Powered eConsultation Analysis Dashboard

A full-stack web application that provides AI-powered sentiment analysis and summarization for stakeholder consultation comments. Built with React (frontend), Node.js/Express (backend), MongoDB (database), and Hugging Face AI models.

## 🚀 Features

- **CSV Upload**: Easy drag-and-drop CSV upload interface
- **AI Processing**: Real-time sentiment analysis and text summarization using Hugging Face models
- **Interactive Dashboard**: Comprehensive analytics with charts and statistics
- **Advanced Search**: Searchable and filterable comments table with pagination
- **Word Cloud Visualization**: Visual representation of key terms
- **Real-time Progress**: Live processing status updates
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Chart.js** for data visualization
- **Lucide React** for icons
- **Papa Parse** for CSV parsing

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Hugging Face Inference API** for AI processing
- **Multer** for file uploads
- **CSV Parser** for server-side CSV processing
- **CORS** enabled for cross-origin requests

### AI Models
- **Sentiment Analysis**: `cardiffnlp/twitter-roberta-base-sentiment-latest`
- **Text Summarization**: `facebook/bart-large-cnn`

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **Hugging Face API Key** (free account required)

## 🔧 Installation & Setup

### 1. Clone and Setup

```bash
# If not already in the project directory
cd "C:\\Users\\penta\\Downloads\\SIH 25035\\project"
```

### 2. Install Frontend Dependencies

```bash
# Install frontend dependencies
npm install
```

### 3. Install Backend Dependencies

```bash
# Navigate to backend directory
cd backend

# Install backend dependencies
npm install

# Return to project root
cd ..
```

### 4. Environment Configuration

#### Backend Environment Setup

1. Copy the environment template:
```bash
cd backend
cp .env.example .env
```

2. Edit the `.env` file with your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/econsultation

# Hugging Face API Configuration
HUGGING_FACE_API_KEY=your_actual_api_key_here
```

3. **Get a Hugging Face API Key**:
   - Go to [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
   - Create a free account if you don't have one
   - Generate a new access token
   - Copy the token to your `.env` file

### 5. Database Setup

#### Option A: Local MongoDB
```bash
# Install MongoDB locally or use Docker
mongod --dbpath /path/to/your/data/directory
```

#### Option B: MongoDB Atlas (Recommended)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in your `.env` file

## 🚀 Running the Application

### Development Mode

You'll need to run both frontend and backend servers:

#### Terminal 1 - Backend Server
```bash
cd backend
npm run dev
```
The backend will start on [http://localhost:5000](http://localhost:5000)

#### Terminal 2 - Frontend Server
```bash
# From project root
npm run dev
```
The frontend will start on [http://localhost:5173](http://localhost:5173)

### Production Mode

#### Build Frontend
```bash
npm run build
```

#### Start Backend
```bash
cd backend
npm start
```

## 📁 Project Structure

```
project/
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/              # Page components (Upload, Results)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── types/              # TypeScript type definitions
│   │   ├── utils/              # Utility functions
│   │   ├── App.tsx             # Main app with routing
│   │   └── main.tsx            # App entry point
│   ├── public/                 # Static assets
│   └── package.json            # Frontend dependencies
├── backend/
│   ├── models/                 # MongoDB models
│   ├── routes/                 # API route definitions
│   ├── services/               # Business logic (AI processing)
│   ├── server.js               # Express server setup
│   └── package.json            # Backend dependencies
└── README.md                   # This file
```

## 🔄 API Endpoints

### Upload & Processing
- `POST /api/upload` - Upload CSV file
- `POST /api/process/:uploadSession` - Trigger AI processing
- `GET /api/status/:uploadSession` - Get processing status

### Data Retrieval
- `GET /api/comments/:uploadSession` - Get paginated comments
- `GET /api/statistics/:uploadSession` - Get sentiment statistics
- `GET /api/wordcloud/:uploadSession` - Get word cloud data

### Health Check
- `GET /health` - Server health status

## 📊 CSV File Format

Your CSV file should have the following structure:

```csv
comment_id,comment_text
1,"This is a great initiative that will benefit our community."
2,"I have concerns about the environmental impact of this project."
3,"The proposal looks good but needs more detailed budget information."
```

**Supported column names** (case-insensitive):
- **ID columns**: `comment_id`, `commentid`, `id`
- **Text columns**: `comment_text`, `commenttext`, `text`, `comment`

## 🤖 AI Processing

The application uses Hugging Face's Inference API for:

1. **Sentiment Analysis**: Classifies comments as positive, negative, or neutral
2. **Text Summarization**: Generates concise summaries of longer comments
3. **Confidence Scoring**: Provides confidence levels for sentiment predictions

Processing happens in the background with real-time progress updates.

## 🔧 Customization

### Changing AI Models

Edit `backend/services/aiProcessor.js`:

```javascript
this.sentimentModel = 'your-preferred-sentiment-model';
this.summarizationModel = 'your-preferred-summarization-model';
```

### Adjusting Processing Batch Size

In `backend/routes/api.js`, modify the `batchSize` variable:

```javascript
const batchSize = 5; // Adjust based on your API rate limits
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network access for MongoDB Atlas

2. **Hugging Face API Errors**
   - Verify API key is correct
   - Check rate limits
   - Ensure models are accessible

3. **CORS Errors**
   - Verify `FRONTEND_URL` in backend `.env`
   - Check if both servers are running

4. **File Upload Issues**
   - Ensure CSV format is correct
   - Check file size limits
   - Verify column names match expected format

### Debugging Tips

- Check browser console for frontend errors
- Monitor backend logs for API issues
- Use the `/health` endpoint to verify backend status
- Test API endpoints directly with tools like Postman

## 🔒 Security Considerations

- API keys are stored in environment variables
- File uploads are validated and processed safely
- CORS is properly configured
- Input validation on all API endpoints
- Rate limiting considerations for AI API calls

## 📈 Performance Optimization

- Background processing for AI analysis
- Pagination for large datasets
- Efficient database indexing
- Optimized frontend bundling with Vite
- Lazy loading for components

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review error logs
3. Verify environment configuration
4. Test with sample data

## 🔄 Future Enhancements

- [ ] Multi-language support
- [ ] Advanced analytics and reporting
- [ ] Export functionality
- [ ] User authentication
- [ ] Comment categorization
- [ ] Real-time collaboration features
- [ ] Integration with more AI providers