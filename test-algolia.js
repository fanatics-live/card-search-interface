// Quick test script to verify Algolia connection
import algoliasearch from 'algoliasearch'

const APP_ID = '3XT9C4X62I'
const API_KEY = 'fdbf8223519dc75dd9743f5f9d308436'
const INDEX_NAME = 'fanatics_cards'

console.log('Testing Algolia connection...')
console.log('App ID:', APP_ID)
console.log('Index:', INDEX_NAME)

const client = algoliasearch(APP_ID, API_KEY)
const index = client.initIndex(INDEX_NAME)

// Test search
try {
  const result = await index.search('', {
    hitsPerPage: 5,
  })

  console.log('\n✅ Connection successful!')
  console.log('Total hits:', result.nbHits)
  console.log('Processing time:', result.processingTimeMS, 'ms')
  console.log('\nFirst 5 results:')
  result.hits.forEach((hit, i) => {
    console.log(`${i + 1}. ${hit.title || hit.objectID}`)
  })

  if (result.nbHits === 0) {
    console.log('\n⚠️  Index is empty or has no records matching the query')
  }
} catch (error) {
  console.error('\n❌ Error connecting to Algolia:')
  console.error(error.message)
  console.error('\nFull error:', error)
}
