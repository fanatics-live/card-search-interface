// Test what fields are returned by the query suggestions index
import algoliasearch from 'algoliasearch'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const client = algoliasearch(
  process.env.VITE_ALGOLIA_APP_ID,
  process.env.VITE_ALGOLIA_SEARCH_API_KEY
)

const suggestionsIndex = client.initIndex('prod_item_state_v1_query_suggestions')

console.log('Fetching query suggestions with empty query...\n')

try {
  const result = await suggestionsIndex.search('', {
    hitsPerPage: 5,
  })

  console.log(`Total hits: ${result.nbHits}`)
  console.log(`Returned hits: ${result.hits.length}\n`)

  if (result.hits.length > 0) {
    console.log('First hit structure:')
    console.log(JSON.stringify(result.hits[0], null, 2))
  }
} catch (error) {
  console.error('Error:', error.message)
  console.error('Full error:', error)
}
