# GameTok - TikTok-style Game Feed App

GameTok is a web application that allows users to scroll through a feed of interactive games in a TikTok-like interface. Users can play games directly in the feed, share their scores on X (formerly Twitter), and submit their own games.

## Features

- Vertical scrolling feed with snap-to-game functionality
- Five games implemented:
  - Flappy Bird: Tap to fly through pipes
  - Memory Game: Match pairs of cards with the same icon
  - Tetris: Arrange falling blocks to clear lines
  - Tic-Tac-Toe: Challenge an AI opponent powered by OpenAI
  - Snow-Bored: Snowboard down slopes avoiding obstacles
- Game submission system with MongoDB backend
- Admin dashboard for reviewing submissions
- Score tracking for each game
- X (Twitter) sharing functionality
- Mobile-friendly with touch controls
- Responsive design that works on various screen sizes

## Technologies Used

- **Next.js 15**: React framework for building the application
- **React 19**: For building user interfaces with the latest features
- **TypeScript**: For type safety and better developer experience
- **MongoDB**: For storing game submissions
- **OpenAI API**: For powering the Tic-Tac-Toe AI opponent
- **Framer Motion**: For smooth animations and transitions
- **React Intersection Observer**: For detecting when a game enters the viewport
- **Tailwind CSS**: For styling
- **Lucide Icons**: For UI icons
- **Canvas API**: For games like Flappy Bird and Snow-Bored

## Getting Started

1. **Clone the repository**

```bash
git clone <repository-url>
cd game-tok/game-feed
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file with the following variables:

```
MONGODB_URI=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_api_key
```

4. **Run the development server**

```bash
npm run dev
```

5. **Open the application**

Navigate to [http://localhost:3000](http://localhost:3000) in your browser

6. **Access the admin dashboard**

Navigate to [http://localhost:3000/admin](http://localhost:3000/admin) to view and manage game submissions

## Game Controls

### Flappy Bird
- Click or tap to make the bird jump
- Avoid the pipes and try to get the highest score

### Memory Game
- Click or tap on cards to flip them
- Find matching pairs of cards
- Match all pairs to complete the game

### Tetris
- Use arrow keys on desktop:
  - Left/Right: Move piece horizontally
  - Down: Move piece down faster
  - Up: Rotate piece
- On mobile, use the on-screen controls
- Clear lines to score points and increase level

## Project Structure

```
game-feed/
├── public/
│   └── thumbnails/      # Game thumbnails
├── src/
│   ├── app/
│   │   ├── globals.css  # Global styles
│   │   ├── layout.tsx   # Root layout component
│   │   └── page.tsx     # Main feed page
│   └── components/
│       └── games/
│           ├── FlappyBird.tsx  # Flappy Bird implementation
│           ├── MemoryGame.tsx  # Memory Game implementation
│           └── Tetris.tsx      # Tetris implementation
```

## Design Decisions

1. **Game as Components**: Each game is implemented as a self-contained React component, making it easy to add new games
2. **Intersection Observer**: Used to detect which game is currently in view to activate it and update the navigation
3. **Score Reporting**: Games report their scores up to the parent component using callback props
4. **Scroll Snapping**: CSS scroll-snap is used to create the TikTok-like scrolling experience
5. **Performance Optimization**: Games are only rendered when in view to save resources

## Future Improvements

- Add more games to the feed
- Implement user accounts and persistent high scores
- Add like/favorite functionality with local storage
- Optimize for performance with React.memo and useCallback
- Add sound toggle controls for all games
- Implement more sophisticated sharing options

## License

This project is available as open source under the terms of the [MIT License](LICENSE).
