// Check for Query Suggestions index
import algoliasearch from 'algoliasearch'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const client = algoliasearch(
  process.env.VITE_ALGOLIA_APP_ID,
  process.env.VITE_ALGOLIA_SEARCH_API_KEY
)

console.log('Checking for Query Suggestions indices...\n')

// Common patterns for query suggestions indices
const possibleNames = [
  'prod_item_state_v1_query_suggestions',
  'prod_query_suggestions',
  'query_suggestions',
  'suggestions',
  'prod_item_state_v1_suggestions',
]

for (const indexName of possibleNames) {
  try {
    const index = client.initIndex(indexName)
    const result = await index.search('', { hitsPerPage: 5 })
    console.log(`✅ Found index: ${indexName}`)
    console.log(`   Total suggestions: ${result.nbHits}`)

    if (result.hits.length > 0) {
      console.log('   Sample suggestions:')
      result.hits.slice(0, 3).forEach((hit) => {
        console.log(`   - ${hit.query || hit.suggestion || JSON.stringify(hit)}`)
      })
    }
    console.log()
  } catch (error) {
    console.log(`❌ Index not found: ${indexName}`)
  }
}

// Also try to search the main index for query patterns
console.log('\nTrying main index for autocomplete...')
try {
  const mainIndex = client.initIndex(process.env.VITE_ALGOLIA_INDEX_NAME)
  const result = await mainIndex.search('lebr', {
    hitsPerPage: 5,
    attributesToRetrieve: ['title', 'brand'],
  })
  console.log(`Main index search works: ${result.nbHits} results`)
  if (result.hits.length > 0) {
    console.log('Sample titles:')
    result.hits.slice(0, 3).forEach(hit => {
      console.log(`  - ${hit.title}`)
    })
  }
} catch (error) {
  console.error('Error with main index:', error.message)
}
