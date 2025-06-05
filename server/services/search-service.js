const { Client } = require('@elastic/elasticsearch');
const natural = require('natural');
const Course = require('../models/Course');
const SearchHistory = require('../models/SearchHistory');
const mongoose = require('mongoose');

// Initialize Elasticsearch client with retry configuration
const elasticClient = new Client({
  node: 'https://localhost:9200',
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme'
  },
  maxRetries: 5,
  requestTimeout: 30000,
  sniffOnStart: false,
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates in development
  }
});

// Initialize tokenizer and stemmer
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// Create Elasticsearch index
async function createIndex() {
  try {
    const indexExists = await elasticClient.indices.exists({ index: 'courses' });
    
    if (!indexExists) {
      await elasticClient.indices.create({
        index: 'courses',
        body: {
          settings: {
            analysis: {
              analyzer: {
                course_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: [
                    'lowercase',
                    'course_synonyms',
                    'english_stop',
                    'english_stemmer'
                  ]
                }
              },
              filter: {
                course_synonyms: {
                  type: 'synonym',
                  synonyms: [
                    "ml, machine learning",
                    "ai, artificial intelligence",
                    "ds, data science",
                    "web dev, web development",
                    "js, javascript",
                    "py, python",
                    "java, core java",
                    "react, reactjs, react.js",
                    "node, nodejs, node.js",
                    "sql, mysql, database",
                    "aws, amazon web services",
                    "devops, dev ops",
                    "ui, user interface",
                    "ux, user experience",
                    "ui/ux, ui ux, user interface design",
                    "dsa, data structures and algorithms",
                    "oop, object oriented programming",
                    "api, application programming interface",
                    "rest, rest api",
                    "graphql, graph ql",
                    "cloud, cloud computing",
                    "azure, microsoft azure",
                    "gcp, google cloud platform",
                    "docker, containerization",
                    "kubernetes, k8s",
                    "ci, continuous integration",
                    "cd, continuous deployment",
                    "ci/cd, cicd, continuous integration and deployment",
                    "git, version control",
                    "agile, agile methodology",
                    "scrum, agile scrum",
                    "big data, hadoop, spark",
                    "mlops, machine learning operations",
                    "nlp, natural language processing",
                    "cv, computer vision",
                    "dl, deep learning",
                    "cnn, convolutional neural network",
                    "rnn, recurrent neural network",
                    "gan, generative adversarial network",
                    "rl, reinforcement learning"
                  ]
                },
                english_stop: {
                  type: 'stop',
                  stopwords: '_english_'
                },
                english_stemmer: {
                  type: 'stemmer',
                  language: 'english'
                }
              }
            }
          },
          mappings: {
            properties: {
              title: { 
                type: 'text',
                analyzer: 'course_analyzer',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256
                  }
                }
              },
              subtitle: { 
                type: 'text',
                analyzer: 'course_analyzer',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256
                  }
                }
              },
              instructorName: { 
                type: 'text',
                analyzer: 'course_analyzer',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256
                  }
                }
              },
              description: { 
                type: 'text',
                analyzer: 'course_analyzer'
              },
              category: { 
                type: 'keyword'
              },
              level: { 
                type: 'keyword'
              },
              primaryLanguage: { 
                type: 'keyword'
              },
              pricing: { 
                type: 'float'
              },
              curriculum: { 
                type: 'nested',
                properties: {
                  title: { 
                    type: 'text',
                    analyzer: 'course_analyzer'
                  },
                  description: { 
                    type: 'text',
                    analyzer: 'course_analyzer'
                  }
                }
              },
              embedding: { 
                type: 'dense_vector',
                dims: 300,
                similarity: 'cosine'
              },
              image: {
                type: 'text'
              }
            }
          }
        }
      });
      console.log('Created courses index with custom analyzer and synonyms');
    } else {
      // Update existing index mapping if needed
      try {
        await elasticClient.indices.putMapping({
          index: 'courses',
          body: {
            properties: {
              title: { 
                type: 'text',
                analyzer: 'course_analyzer',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256
                  }
                }
              },
              subtitle: { 
                type: 'text',
                analyzer: 'course_analyzer',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256
                  }
                }
              },
              instructorName: { 
                type: 'text',
                analyzer: 'course_analyzer',
                fields: {
                  keyword: {
                    type: 'keyword',
                    ignore_above: 256
                  }
                }
              },
              description: { type: 'text', analyzer: 'course_analyzer' },
              category: { type: 'keyword' },
              level: { type: 'keyword' },
              primaryLanguage: { type: 'keyword' },
              pricing: { type: 'float' },
              curriculum: { 
                type: 'nested',
                properties: {
                  title: { type: 'text', analyzer: 'course_analyzer' },
                  description: { type: 'text', analyzer: 'course_analyzer' }
                }
              },
              embedding: { 
                type: 'dense_vector',
                dims: 300,
                similarity: 'cosine'
              },
              image: {
                type: 'text'
              }
            }
          }
        });
        console.log('Updated courses index mapping');
      } catch (error) {
        console.error('Error updating index mapping:', error);
      }
    }
  } catch (error) {
    console.error('Error creating/updating Elasticsearch index:', error);
    throw error;
  }
}

// Generate text embedding using TF-IDF
function generateEmbedding(text) {
  const tokens = tokenizer.tokenize(text.toLowerCase());
  const stemmedTokens = tokens.map(token => stemmer.stem(token));
  
  // Create a simple TF-IDF vector (in a real system, you'd use a pre-trained model)
  const tfidf = new natural.TfIdf();
  tfidf.addDocument(stemmedTokens);
  
  // Convert to a fixed-size vector (300 dimensions)
  const vector = new Array(300).fill(0);
  const terms = tfidf.listTerms(0);
  
  terms.forEach((term, index) => {
    if (index < 300) {
      vector[index] = term.tfidf;
    }
  });
  
  return vector;
}

// Index a course in Elasticsearch
async function indexCourse(course) {
  try {
    const courseText = `${course.title} ${course.subtitle} ${course.description} ${course.instructorName}`;
    const embedding = generateEmbedding(courseText);
    
    // Convert MongoDB document to Elasticsearch document, excluding _id
    const esDoc = {
      title: course.title,
      subtitle: course.subtitle,
      instructorName: course.instructorName,
      description: course.description,
      category: course.category,
      level: course.level,
      primaryLanguage: course.primaryLanguage,
      pricing: course.pricing,
      curriculum: course.curriculum,
      embedding: embedding,
      image: course.image // Ensure image is included in the document
    };
    
    const courseId = course._id.toString();
    
    await elasticClient.index({
      index: 'courses',
      id: courseId, // Use MongoDB _id as Elasticsearch document ID
      body: esDoc,
      refresh: true // Make the document immediately searchable
    });
    
    console.log(`Indexed course ${courseId}`);
  } catch (error) {
    console.error('Error indexing course:', error);
    throw error;
  }
}

// Function to check Elasticsearch connection with more detailed logging
async function checkElasticsearchConnection() {
  try {
    console.log('Attempting to connect to Elasticsearch...');
    
    // First try a simple ping
    const pingResponse = await elasticClient.ping();
    console.log('Elasticsearch ping successful');
    
    // Then try to get cluster info
    const info = await elasticClient.info();
    console.log('Elasticsearch cluster info:', {
      name: info.cluster_name,
      version: info.version.number,
      status: info.status
    });
    
    return true;
  } catch (error) {
    console.error('Elasticsearch connection error details:', {
      message: error.message,
      name: error.name,
      meta: error.meta,
      statusCode: error.meta?.statusCode,
      body: error.meta?.body
    });
    return false;
  }
}

// Initialize the search service with retry logic
async function initializeSearchService() {
  let retries = 3;
  let connected = false;

  while (retries > 0 && !connected) {
    try {
      connected = await checkElasticsearchConnection();
      if (connected) {
        await createIndex();
        
        // Index all existing courses
        const courses = await Course.find({});
        for (const course of courses) {
          await indexCourse(course);
        }
        
        console.log('Search service initialized successfully');
        return;
      }
    } catch (error) {
      console.error(`Failed to initialize search service (attempts left: ${retries}):`, error.message);
      retries--;
      if (retries > 0) {
        console.log('Retrying in 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  if (!connected) {
    console.error('Failed to connect to Elasticsearch after multiple attempts');
    throw new Error('Could not connect to Elasticsearch');
  }
}

// Add new functions for recommendation system
async function recordSearchQuery(userId, query, filters = {}) {
  try {
    await SearchHistory.create({
      userId,
      query,
      filters,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error recording search query:', error);
  }
}

async function getPopularSearches(limit = 10) {
  try {
    const searches = await SearchHistory.aggregate([
      {
        $group: {
          _id: '$query',
          count: { $sum: 1 },
          lastSearched: { $max: '$timestamp' }
        }
      },
      { $sort: { count: -1, lastSearched: -1 } },
      { $limit: limit }
    ]);
    return searches;
  } catch (error) {
    console.error('Error getting popular searches:', error);
    return [];
  }
}

async function getPersonalizedRecommendations(userId, limit = 5) {
  try {
    // Get user's recent search history
    const recentSearches = await SearchHistory.find({ userId })
      .sort({ timestamp: -1 })
      .limit(10);

    if (recentSearches.length === 0) {
      // If no search history, return popular courses
      return await getPopularCourses(limit);
    }

    // Extract search terms and filters
    const searchTerms = recentSearches.map(s => s.query);
    const commonFilters = recentSearches.reduce((acc, search) => {
      Object.entries(search.filters).forEach(([key, value]) => {
        if (!acc[key]) acc[key] = new Set();
        if (Array.isArray(value)) {
          value.forEach(v => acc[key].add(v));
        } else {
          acc[key].add(value);
        }
      });
      return acc;
    }, {});

    // Convert filters to arrays
    const filters = Object.entries(commonFilters).reduce((acc, [key, value]) => {
      acc[key] = Array.from(value);
      return acc;
    }, {});

    // Search for courses matching recent interests
    const searchResults = await searchCourses(
      searchTerms.join(' '),
      filters,
      'relevance',
      1,
      limit * 2 // Get more results to filter
    );

    // Get course IDs to exclude (courses user has already viewed)
    const viewedCourses = await SearchHistory.distinct('viewedCourseId', { userId });
    
    // Filter out viewed courses and limit results
    const recommendations = searchResults.hits
      .filter(course => !viewedCourses.includes(course._id))
      .slice(0, limit);

    return recommendations;
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    return await getPopularCourses(limit);
  }
}

async function getPopularCourses(limit = 5) {
  try {
    const response = await elasticClient.search({
      index: 'courses',
      body: {
        query: {
          function_score: {
            query: { match_all: {} },
            functions: [
              {
                field_value_factor: {
                  field: 'viewCount',
                  factor: 1.2,
                  modifier: 'log1p',
                  missing: 1
                }
              },
              {
                gauss: {
                  'createdAt': {
                    origin: 'now',
                    scale: '30d',
                    decay: 0.5
                  }
                }
              }
            ],
            boost_mode: 'multiply'
          }
        },
        size: limit
      }
    });

    return response.hits.hits.map(hit => hit._source);
  } catch (error) {
    console.error('Error getting popular courses:', error);
    return [];
  }
}

// Get course recommendations based on a course ID
async function getSimilarCourses(courseId, limit = 5) {
  try {
    // Add a check for valid courseId
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      console.warn('Invalid courseId provided for getSimilarCourses');
      return []; // Return empty array for invalid ID
    }

    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Generate embedding for the course
    const courseText = `${course.title} ${course.subtitle} ${course.description}`;
    const embedding = generateEmbedding(courseText);

    // Search for similar courses using vector similarity and content matching
    const response = await elasticClient.search({
      index: 'courses',
      body: {
        query: {
          bool: {
            should: [
              {
                script_score: {
                  query: { match_all: {} },
                  script: {
                    source: "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                    params: { query_vector: embedding }
                  }
                }
              },
              {
                multi_match: {
                  query: courseText,
                  fields: ['title^3', 'subtitle^2', 'description'],
                  type: 'best_fields',
                  analyzer: 'course_analyzer'
                }
              }
            ],
            must_not: [
              { term: { _id: courseId.toString() } }
            ],
            filter: [
              { term: { category: course.category } }
            ]
          }
        },
        size: limit
      }
    });

    return response.hits.hits.map(hit => hit._source);
  } catch (error) {
    console.error('Error getting similar courses:', error);
    return [];
  }
}

// Modify searchCourses to use fuzzy matching and handle empty query
async function searchCourses(query, filters = {}, sortBy = 'price-lowtohigh', page = 1, size = 10, userId = null) {
  try {
    const isConnected = await checkElasticsearchConnection();
    if (!isConnected) {
      console.log('Elasticsearch not available, falling back to MongoDB search');
      // Fallback to MongoDB search, which already handles empty queries
      return await fallbackToMongoDBSearch(query, filters, sortBy, page, size);
    }

    // Record the search query if userId is provided and query is not empty
    if (userId && query && query.trim() !== '') {
      await recordSearchQuery(userId, query, filters);
    }

    let searchQuery;

    // If the query is empty, perform a match_all search
    if (!query || query.trim() === '') {
      searchQuery = {
        bool: {
          filter: []
        }
      };
    } else {
      // Otherwise, use the existing multi_match and match_phrase_prefix query
      searchQuery = {
        bool: {
          should: [
            {
              multi_match: {
                query: query,
                fields: ['title^3', 'subtitle^2', 'description', 'instructorName', 'curriculum.title^2', 'curriculum.description'],
                type: 'best_fields',
                fuzziness: 'AUTO',
                prefix_length: 1,
                analyzer: 'course_analyzer'
              }
            },
            {
              match_phrase_prefix: {
                title: {
                  query: query,
                  slop: 2,
                  analyzer: 'course_analyzer'
                }
              }
            }
          ],
          minimum_should_match: 1,
          filter: []
        }
      };
    }

    // Add filters (applied to both match_all and search queries)
    if (filters.category?.length) {
      searchQuery.bool.filter.push({ terms: { category: filters.category } });
    } else if (filters.category !== undefined) { // Handle empty array explicitly
       // If category is explicitly set to an empty array, apply no category filter
    }

    if (filters.level?.length) {
      searchQuery.bool.filter.push({ terms: { level: filters.level } });
    } else if (filters.level !== undefined) { // Handle empty array explicitly
       // If level is explicitly set to an empty array, apply no level filter
    }

    if (filters.primaryLanguage?.length) {
      searchQuery.bool.filter.push({ terms: { primaryLanguage: filters.primaryLanguage } });
    } else if (filters.primaryLanguage !== undefined) { // Handle empty array explicitly
       // If primaryLanguage is explicitly set to an empty array, apply no primaryLanguage filter
    }

    // Add sorting
    let sort = [];
    switch (sortBy) {
      case 'price-lowtohigh':
        sort.push({ pricing: 'asc' });
        break;
      case 'price-hightolow':
        sort.push({ pricing: 'desc' });
        break;
      case 'title-atoz':
        sort.push({ 'title.keyword': 'asc' });
        break;
      case 'title-ztoa':
        sort.push({ 'title.keyword': 'desc' });
        break;
      default:
        // Default sort by relevance and then price for search queries, or just price for match_all
        if (query && query.trim() !== '') {
           sort.push('_score');
        }
        sort.push({ pricing: 'asc' });
    }

    // Add relevance score to sort as the primary sort key unless explicitly sorting by title or if query is empty
    if ((query && query.trim() !== '') && !sortBy.startsWith('title-')) {
      sort.unshift('_score');
    }

    console.log('Elasticsearch Search Query:', JSON.stringify(searchQuery, null, 2));

    const response = await elasticClient.search({
      index: 'courses',
      body: {
        query: searchQuery,
        sort: sort,
        from: (page - 1) * size,
        size: size,
        highlight: {
          fields: {
            title: {},
            subtitle: {},
            description: {},
            'curriculum.title': {},
            'curriculum.description': {}
          },
          pre_tags: ['<mark>'],
          post_tags: ['</mark>']
        }
      }
    });

    // Get recommendations based on the search (only if there's a query)
    let recommendations = [];
    if (query && query.trim() !== '') {
      recommendations = await getSearchBasedRecommendations(query, filters, size);
    }

    return {
      hits: response.hits.hits.map(hit => ({
        ...hit._source,
        _id: hit._id,
        score: hit._score,
        highlights: hit.highlight
      })),
      total: response.hits.total.value,
      recommendations: recommendations
    };
  } catch (error) {
    console.error('Error searching courses:', error);
    // Fallback to MongoDB search on error, which also handles empty queries
    return await fallbackToMongoDBSearch(query, filters, sortBy, page, size);
  }
}

async function getSearchBasedRecommendations(query, filters, limit = 5) {
  try {
    // Get popular searches similar to the current query
    const popularSearches = await getPopularSearches(10);
    const similarSearches = popularSearches
      .filter(s => s._id.toLowerCase().includes(query.toLowerCase()) || 
                   query.toLowerCase().includes(s._id.toLowerCase()))
      .slice(0, 3);

    if (similarSearches.length === 0) {
      return [];
    }

    // Search for courses based on similar popular searches
    const searchTerms = similarSearches.map(s => s._id).join(' ');
    const response = await elasticClient.search({
      index: 'courses',
      body: {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: searchTerms,
                  fields: ['title^3', 'subtitle^2', 'description'],
                  type: 'best_fields',
                  analyzer: 'course_analyzer'
                }
              }
            ],
            filter: Object.entries(filters).map(([key, value]) => ({
              terms: { [key]: Array.isArray(value) ? value : [value] }
            }))
          }
        },
        size: limit
      }
    });

    return response.hits.hits.map(hit => hit._source);
  } catch (error) {
    console.error('Error getting search-based recommendations:', error);
    return [];
  }
}

// Fallback search function using MongoDB
async function fallbackToMongoDBSearch(query, filters, sortBy, page, size) {
  try {
    let mongoFilters = {};
    
    // Add text search
    if (query) {
      mongoFilters.$or = [
        { title: { $regex: query, $options: 'i' } },
        { subtitle: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { instructorName: { $regex: query, $options: 'i' } }
      ];
    }

    // Add other filters
    if (filters.category?.length) {
      mongoFilters.category = { $in: filters.category };
    }
    if (filters.level?.length) {
      mongoFilters.level = { $in: filters.level };
    }
    if (filters.primaryLanguage?.length) {
      mongoFilters.primaryLanguage = { $in: filters.primaryLanguage };
    }

    // Add sorting
    let sortParam = {};
    switch (sortBy) {
      case 'price-lowtohigh':
        sortParam.pricing = 1;
        break;
      case 'price-hightolow':
        sortParam.pricing = -1;
        break;
      case 'title-atoz':
        sortParam.title = 1;
        break;
      case 'title-ztoa':
        sortParam.title = -1;
        break;
      default:
        sortParam.pricing = 1;
    }

    const [courses, total] = await Promise.all([
      Course.find(mongoFilters)
        .select('_id title subtitle instructorName description category level primaryLanguage pricing curriculum image') // Explicitly select fields including _id and image
        .sort(sortParam)
        .skip((page - 1) * size)
        .limit(size),
      Course.countDocuments(mongoFilters)
    ]);

    return {
      hits: courses,
      total: total
    };
  } catch (error) {
    console.error('Error in MongoDB fallback search:', error);
    throw error;
  }
}

module.exports = {
  initializeSearchService,
  indexCourse,
  searchCourses,
  getCourseRecommendations: getSimilarCourses,
  getPersonalizedRecommendations,
  getPopularCourses,
  getPopularSearches,
  recordSearchQuery,
  checkElasticsearchConnection
}; 