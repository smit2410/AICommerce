const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb'); // Import MongoClient
const fetch = require('node-fetch'); // Import node-fetch for making API calls

const app = express();
const port = 3001;

// MongoDB Connection URI (replace with your actual URI)
const uri = 'mongodb://localhost:27017/Clone_db';
const client = new MongoClient(uri);

// Replace with your actual RapidAPI key and the API endpoint URL
const rapidApiKey = 'x-rapidapi-key: 27cb40e472mshf646caededee3e2p12ee35jsn47adc6607ede';
const rapidApiBaseUrl = 'https://real-time-amazon-data.p.rapidapi.com/search'; // Adjust path if needed
const rapidApiHost = 'real-time-amazon-data.p.rapidapi.com'; // Ensure this matches the API host

async function connectToMongo() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db(); // Get the database instance
        console.log('Connected to database:', db.databaseName); // Log the database name
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1); // Exit if connection fails
    }
}

connectToMongo();

app.use(cors());
app.use(express.json());

app.post('/api/store-search', async (req, res) => {
    const { query } = req.body;
    if (query) {
        console.log('Received search query:', query);
        const db = client.db(); // Get the database instance
        const searchQueriesCollection = db.collection('search_queries'); // Get the collection

        try {
            const result = await searchQueriesCollection.insertOne({
                query: query,
                timestamp: new Date()
            });
            console.log('Search query saved to MongoDB:', result);
            res.sendStatus(200);
        } catch (error) {
            console.error('Error saving search query to MongoDB:', error);
            res.status(500).send('Failed to save search query.');
        }
    } else {
        res.status(400).send('Search query is missing.');
    }
});

app.post('/api/recommendations', async (req, res) => {
    const { query, budget } = req.body;
    const country = 'US'; // Or get this from the user if needed
    const numResults = 5; // Number of recommendations to fetch

    if (!query || !budget) {
        return res.status(400).json({ error: 'Search query and budget are required.' });
    }

    // Construct the RapidAPI URL with parameters
    const apiUrl = `${rapidApiBaseUrl}?query=${encodeURIComponent(query)}&country=${country}&num_results=${numResults}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': rapidApiKey,
                'X-RapidAPI-Host': rapidApiHost
            }
        });

        const data = await response.json();
        console.log('RapidAPI Recommendations Response:', data); // For debugging

        if (data && data.results) {
            // Filter results by budget on the server-side
            const budgetFilteredResults = data.results.filter(item => {
                if (item.product_price) {
                    const priceString = item.product_price.replace(/[^\d.]/g, '');
                    const price = parseFloat(priceString);
                    return !isNaN(price) && price <= parseFloat(budget); // Ensure budget is also a number
                }
                return false;
            });

            // Implement logic to determine "best" products (e.g., sort by rating)
            const sortedResults = budgetFilteredResults.sort((a, b) => {
                const ratingA = parseFloat(a.product_star_rating) || 0;
                const ratingB = parseFloat(b.product_star_rating) || 0;
                return ratingB - ratingA; // Sort by rating descending
            });

            const recommendations = sortedResults.map(item => ({
                title: item.product_title,
                price: item.product_price,
                link: item.product_url,
                image: item.product_photo,
                rating: item.product_star_rating,
                num_ratings: item.product_num_ratings,
                is_best_seller: item.is_best_seller,
                sales_volume: item.sales_volume
            }));

            res.json({ recommendations });
        } else {
            res.json({ recommendations: [] });
        }

    } catch (error) {
        console.error('Error fetching recommendations from RapidAPI:', error);
        res.status(500).json({ error: 'Failed to get recommendations.' });
    }
});

app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});