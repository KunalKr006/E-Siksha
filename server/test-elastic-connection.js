const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

async function testConnection() {
  console.log('Testing Elastic Cloud connection...');
  console.log('URL:', process.env.ELASTICSEARCH_URL);
  
  const client = new Client({
    node: process.env.ELASTICSEARCH_URL,
    auth: {
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD
    },
    tls: {
      rejectUnauthorized: true
    }
  });

  try {
    // Test basic connection
    console.log('\n1. Testing basic connection...');
    const health = await client.cluster.health();
    console.log('✅ Cluster health:', {
      status: health.status,
      numberOfNodes: health.number_of_nodes,
      activeShards: health.active_shards
    });

    // Test index operations
    console.log('\n2. Testing index operations...');
    const testIndex = 'test-index-' + Date.now();
    
    // Create test index
    await client.indices.create({ 
      index: testIndex,
      body: {
        mappings: {
          properties: {
            title: { type: 'text' },
            content: { type: 'text' }
          }
        }
      }
    });
    console.log('✅ Test index created');

    // Index a test document
    await client.index({
      index: testIndex,
      document: {
        title: 'Test Document',
        content: 'This is a test document for Elastic Cloud connection'
      }
    });
    console.log('✅ Test document indexed');

    // Search test document
    const searchResult = await client.search({
      index: testIndex,
      query: {
        match: {
          title: 'Test'
        }
      }
    });
    console.log('✅ Search test successful:', {
      hits: searchResult.hits.total.value,
      took: searchResult.took + 'ms'
    });

    // Clean up test index
    await client.indices.delete({ index: testIndex });
    console.log('✅ Test index cleaned up');

    console.log('\n🎉 All tests passed! Your Elastic Cloud connection is working correctly.');
  } catch (error) {
    console.error('\n❌ Connection test failed:', {
      message: error.message,
      meta: error.meta?.body || error.meta,
      statusCode: error.meta?.statusCode
    });
    
    if (error.meta?.statusCode === 401) {
      console.error('\nAuthentication failed. Please check your credentials:');
      console.error('- Username:', process.env.ELASTICSEARCH_USERNAME);
      console.error('- Password length:', process.env.ELASTICSEARCH_PASSWORD?.length);
    } else if (error.meta?.statusCode === 403) {
      console.error('\nAuthorization failed. Please check your permissions.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\nConnection refused. Please check your Elastic Cloud URL.');
    }
  }
}

// Run the test
testConnection(); 