import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/user.model.js';
import { Movie } from '../models/movie.model.js';
import { Theatre } from '../models/theatre.model.js';
import { Screen } from '../models/screen.model.js';
import { Show } from '../models/show.model.js';
import { logger } from './logger.js';
import { calculateEndTime } from '../services/scheduleConflict.service.js';

export const seedDatabase = async () => {
  logger.info('Starting full database seed process...');

  // 1. Seed Users (Admin & Customer)
  const defaultAdmin = {
    name: 'Cinema Admin',
    email: 'admin@imovies.com',
    password: 'Admin@123456',
    phone: '+91 98765 43210',
    role: 'admin',
    accountStatus: 'active'
  };

  const defaultCustomer = {
    name: 'Demo Customer',
    email: 'customer@imovies.com',
    password: 'Customer@123456',
    phone: '+91 98765 00000',
    role: 'user',
    accountStatus: 'active'
  };

  const adminExists = await User.findOne({ email: defaultAdmin.email });
  if (!adminExists) {
    await User.create(defaultAdmin);
    logger.success(`Default Admin created: ${defaultAdmin.email}`);
  }

  const customerExists = await User.findOne({ email: defaultCustomer.email });
  if (!customerExists) {
    await User.create(defaultCustomer);
    logger.success(`Default Customer created: ${defaultCustomer.email}`);
  }

  // 2. Seed Movies
  const sampleMovies = [
    {
      title: 'Interstellar',
      description: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
      poster: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80',
      backdrop: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
      genres: ['Sci-Fi', 'Adventure', 'Drama'],
      languages: ['English', 'Hindi'],
      formats: ['2D', '3D', 'IMAX 3D'],
      duration: 169,
      director: 'Christopher Nolan',
      cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
      releaseDate: new Date('2024-11-07'),
      certification: 'UA',
      trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
      status: 'now_showing',
      rating: 8.7
    },
    {
      title: 'Dune: Part Two',
      description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future.',
      poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
      genres: ['Sci-Fi', 'Adventure', 'Action'],
      languages: ['English', 'Hindi'],
      formats: ['2D', '3D', 'IMAX 3D', '4DX'],
      duration: 166,
      director: 'Denis Villeneuve',
      cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem'],
      releaseDate: new Date('2024-03-01'),
      certification: 'UA',
      trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
      status: 'now_showing',
      rating: 8.9
    },
    {
      title: 'Oppenheimer',
      description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
      poster: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&auto=format&fit=crop&q=80',
      backdrop: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1200&auto=format&fit=crop&q=80',
      genres: ['Biography', 'Drama', 'History'],
      languages: ['English', 'Hindi'],
      formats: ['2D', 'IMAX'],
      duration: 180,
      director: 'Christopher Nolan',
      cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.'],
      releaseDate: new Date('2023-07-21'),
      certification: 'A',
      trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
      status: 'now_showing',
      rating: 8.9
    },
    {
      title: 'Spider-Man: Across the Spider-Verse',
      description: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.',
      poster: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=600&auto=format&fit=crop&q=80',
      backdrop: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80',
      genres: ['Animation', 'Action', 'Adventure'],
      languages: ['English', 'Hindi', 'Tamil'],
      formats: ['2D', '3D', '4DX'],
      duration: 140,
      director: 'Joaquim Dos Santos, Kemp Powers',
      cast: ['Shameik Moore', 'Hailee Steinfeld', 'Oscar Isaac'],
      releaseDate: new Date('2023-06-02'),
      certification: 'U',
      trailerUrl: 'https://www.youtube.com/watch?v=cqGjhVJWtEg',
      status: 'now_showing',
      rating: 8.8
    },
    {
      title: 'Inception',
      description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
      poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
      backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
      genres: ['Action', 'Sci-Fi', 'Thriller'],
      languages: ['English', 'Hindi'],
      formats: ['2D', 'IMAX'],
      duration: 148,
      director: 'Christopher Nolan',
      cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page'],
      releaseDate: new Date('2024-07-16'),
      certification: 'UA',
      trailerUrl: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
      status: 'now_showing',
      rating: 8.8
    },
    {
      title: 'Gladiator II',
      description: 'Years after witnessing the death of the revered hero Maximus at the hands of his uncle, Lucius must enter the Colosseum after his home is conquered by the tyrannical Emperors who now lead Rome with an iron fist.',
      poster: 'https://images.unsplash.com/photo-1533928298208-27ff66555d8d?w=600&auto=format&fit=crop&q=80',
      backdrop: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
      genres: ['Action', 'Drama', 'Adventure'],
      languages: ['English', 'Hindi'],
      formats: ['2D', 'IMAX 3D', '4DX'],
      duration: 148,
      director: 'Ridley Scott',
      cast: ['Paul Mescal', 'Pedro Pascal', 'Denzel Washington', 'Connie Nielsen'],
      releaseDate: new Date('2024-11-22'),
      certification: 'A',
      trailerUrl: 'https://www.youtube.com/watch?v=4rgYUipGJNo',
      status: 'upcoming',
      rating: 8.4
    }
  ];

  const createdMovies = [];
  for (const movieData of sampleMovies) {
    let movie = await Movie.findOne({ title: movieData.title });
    if (!movie) {
      movie = await Movie.create(movieData);
      logger.success(`Movie created: ${movie.title}`);
    }
    createdMovies.push(movie);
  }

  // 3. Seed Theatres
  const sampleTheatres = [
    {
      name: 'IMovies PVR IMAX Phoenix Palladium',
      description: 'Premier luxury flagship cinema with laser projection and immersive sound.',
      address: 'High Street Phoenix, Senapati Bapat Marg, Lower Parel',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400013',
      phone: '+91 22 4333 9999',
      email: 'palladium.mumbai@imovies.com',
      amenities: ['Dolby Atmos', '4K Laser Projection', 'Recliner Seats', 'Gourmet Food', 'Parking', 'Wheelchair Accessible'],
      status: 'active'
    },
    {
      name: 'IMovies INOX Megaplex Inorbit Mall',
      description: 'State-of-the-art 11-screen megaplex featuring IMAX, ScreenX, and Insignia lounges.',
      address: 'Inorbit Mall, Link Road, Malad West',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400064',
      phone: '+91 22 6755 8888',
      email: 'inorbit.mumbai@imovies.com',
      amenities: ['Dolby Atmos', 'Laser IMAX', 'Recliner Seats', 'Valet Parking', 'Wheelchair Accessible'],
      status: 'active'
    },
    {
      name: 'IMovies Cinepolis Select Citywalk',
      description: 'Ultra-modern multiplex in South Delhi with premium VIP seating and fine dining.',
      address: 'Select Citywalk Mall, Saket District Centre',
      city: 'Delhi-NCR',
      state: 'Delhi',
      zipCode: '110017',
      phone: '+91 11 4265 8282',
      email: 'select.delhi@imovies.com',
      amenities: ['Dolby Atmos', '4DX', 'Recliner Seats', 'Gourmet Food', 'Parking', 'Wheelchair Accessible'],
      status: 'active'
    },
    {
      name: 'IMovies PVR Vega City IMAX',
      description: 'South Bengaluru premium cinema destination featuring south India largest IMAX screen.',
      address: 'Vega City Mall, Bannerghatta Main Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      zipCode: '560076',
      phone: '+91 80 6799 4444',
      email: 'vegacity.blr@imovies.com',
      amenities: ['Laser IMAX', 'Dolby Atmos', 'Recliner Seats', 'Parking', 'Wheelchair Accessible'],
      status: 'active'
    }
  ];

  const createdTheatres = [];
  for (const tData of sampleTheatres) {
    let theatre = await Theatre.findOne({ name: tData.name });
    if (!theatre) {
      theatre = await Theatre.create(tData);
      logger.success(`Theatre created: ${theatre.name} (${theatre.city})`);
    }
    createdTheatres.push(theatre);
  }

  // 4. Seed Screens for each Theatre
  const createdScreens = [];
  for (const theatre of createdTheatres) {
    const existingScreens = await Screen.find({ theatreId: theatre._id });
    if (existingScreens.length === 0) {
      // Create Screen 1: IMAX Laser Auditorium
      const screen1 = await Screen.create({
        theatreId: theatre._id,
        name: 'Audi 1 - Laser IMAX',
        screenType: 'Laser IMAX',
        supportedFormats: ['2D', '3D', 'IMAX 3D'],
        seatingLayout: {
          rows: [
            { rowLabel: 'A', category: 'vip', seatsCount: 10, accessibleSeats: [1, 2] },
            { rowLabel: 'B', category: 'vip', seatsCount: 10, accessibleSeats: [] },
            { rowLabel: 'C', category: 'premium', seatsCount: 12, accessibleSeats: [] },
            { rowLabel: 'D', category: 'premium', seatsCount: 12, accessibleSeats: [] },
            { rowLabel: 'E', category: 'premium', seatsCount: 12, accessibleSeats: [] },
            { rowLabel: 'F', category: 'standard', seatsCount: 14, accessibleSeats: [] },
            { rowLabel: 'G', category: 'standard', seatsCount: 14, accessibleSeats: [] },
            { rowLabel: 'H', category: 'standard', seatsCount: 14, accessibleSeats: [] }
          ]
        },
        status: 'active'
      });

      // Create Screen 2: Dolby Atmos Auditorium
      const screen2 = await Screen.create({
        theatreId: theatre._id,
        name: 'Audi 2 - Dolby Atmos 4K',
        screenType: 'Dolby Cinema',
        supportedFormats: ['2D', '3D'],
        seatingLayout: {
          rows: [
            { rowLabel: 'A', category: 'vip', seatsCount: 8, accessibleSeats: [1] },
            { rowLabel: 'B', category: 'premium', seatsCount: 10, accessibleSeats: [] },
            { rowLabel: 'C', category: 'premium', seatsCount: 10, accessibleSeats: [] },
            { rowLabel: 'D', category: 'standard', seatsCount: 12, accessibleSeats: [] },
            { rowLabel: 'E', category: 'standard', seatsCount: 12, accessibleSeats: [] },
            { rowLabel: 'F', category: 'standard', seatsCount: 12, accessibleSeats: [] }
          ]
        },
        status: 'active'
      });

      logger.success(`Screens created for ${theatre.name}: 2 auditoriums`);
      createdScreens.push(screen1, screen2);
    } else {
      createdScreens.push(...existingScreens);
    }
  }

  // 5. Seed Shows across today and upcoming days
  const today = new Date();
  const dates = [
    new Date(today),
    new Date(today.getTime() + 24 * 60 * 60 * 1000),
    new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)
  ];

  let showsCreatedCount = 0;
  for (const date of dates) {
    const showDate = new Date(date);
    showDate.setUTCHours(0, 0, 0, 0);

    for (const screen of createdScreens) {
      const existingShows = await Show.find({
        screenId: screen._id,
        showDate: {
          $gte: showDate,
          $lte: new Date(showDate.getTime() + 24 * 60 * 60 * 1000 - 1)
        }
      });

      if (existingShows.length === 0) {
        // Schedule non-conflicting showtimes: Morning, Afternoon, Evening, Night
        const slots = [
          { startTime: '10:00', movie: createdMovies[0] }, // Interstellar
          { startTime: '14:30', movie: createdMovies[1] }, // Dune 2
          { startTime: '18:45', movie: createdMovies[2] }, // Oppenheimer
        ];

        for (const slot of slots) {
          const duration = slot.movie.duration || 150;
          const endTime = calculateEndTime(slot.startTime, duration, 20);

          await Show.create({
            movieId: slot.movie._id,
            theatreId: screen.theatreId,
            screenId: screen._id,
            showDate,
            startTime: slot.startTime,
            endTime,
            format: slot.movie.formats?.[0] || '2D',
            language: slot.movie.languages?.[0] || 'English',
            pricing: {
              standard: 220,
              premium: 350,
              vip: 550
            },
            status: 'scheduled'
          });
          showsCreatedCount++;
        }
      }
    }
  }

  if (showsCreatedCount > 0) {
    logger.success(`Scheduled ${showsCreatedCount} conflict-free shows across screens!`);
  } else {
    logger.info('Shows already exist in database for upcoming dates.');
  }

  logger.success('Database fully seeded with realistic cinema data!');
};

const runSeed = async () => {
  try {
    await connectDB();
    await seedDatabase();
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    logger.error(`Seed failed: ${error.message}`, { stack: error.stack });
    await disconnectDB();
    process.exit(1);
  }
};

if (process.argv[1]?.endsWith('seed.js')) {
  runSeed();
}
