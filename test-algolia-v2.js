// Test with correct index name
import algoliasearch from 'algoliasearch'

const APP_ID = '3XT9C4X62I'
const API_KEY = 'fdbf8223519dc75dd9743f5f9d308436'
const INDEX_NAME = 'dev_item_state_v1'

console.log('Testing Algolia connection...')
console.log('App ID:', APP_ID)
console.log('Index:', INDEX_NAME)
console.log('')

const client = algoliasearch(APP_ID, API_KEY)
const index = client.initIndex(INDEX_NAME)

try {
  // Test empty search to get some results
  const result = await index.search('', {
    hitsPerPage: 3,
  })

  console.log('✅ Connection successful!')
  console.log('Total hits in index:', result.nbHits)
  console.log('Processing time:', result.processingTimeMS, 'ms')

  if (result.nbHits > 0) {
    console.log('\n📦 Sample results:')
    result.hits.forEach((hit, i) => {
      console.log(`\n${i + 1}. Object ID: ${hit.objectID}`)
      console.log(`   Title: ${hit.title || 'N/A'}`)
      console.log(`   Listing ID: ${hit.listingId || 'N/A'}`)
      console.log(`   Price: $${hit.currentPrice || 'N/A'}`)
      console.log(`   Grade: ${hit.gradingService || 'N/A'} ${hit.grade || ''}`)
      console.log(`   Status: ${hit.status || 'N/A'}`)
    })

    // Test a search query
    console.log('\n\n🔍 Testing search for "lebron"...')
    const searchResult = await index.search('lebron', {
      hitsPerPage: 3,
    })
    console.log(`Found ${searchResult.nbHits} results for "lebron"`)

    if (searchResult.nbHits > 0) {
      console.log('\nFirst result:')
      const first = searchResult.hits[0]
      console.log(`  Title: ${first.title || 'N/A'}`)
      console.log(`  Price: $${first.currentPrice || 'N/A'}`)
    }
  } else {
    console.log('\n⚠️  Index exists but is empty')
  }

  console.log('\n✅ Everything is working!')

} catch (error) {
  console.error('\n❌ Error:')
  console.error('Message:', error.message)
  console.error('Status:', error.status)
}
