import algoliasearch from 'algoliasearch'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const client = algoliasearch(
  process.env.VITE_ALGOLIA_APP_ID,
  process.env.VITE_ALGOLIA_SEARCH_API_KEY
)
const index = client.initIndex(process.env.VITE_ALGOLIA_INDEX_NAME)

async function testFilters() {
  console.log('Testing filters for "billy" + "auto"...\n')

  // Test 1: No filter (baseline)
  const result1 = await index.search('billy', { hitsPerPage: 1 })
  console.log(`✓ No filter: ${result1.nbHits} results`)

  // Test 2: Try customFilters:"auto"
  try {
    const result2 = await index.search('billy', {
      filters: 'customFilters:"auto"',
      hitsPerPage: 1,
    })
    console.log(`✓ customFilters:"auto": ${result2.nbHits} results`)
  } catch (err) {
    console.log(`✗ customFilters:"auto" ERROR:`, err.message)
  }

  // Test 3: Check if the field exists and is an array
  const sampleResult = await index.search('billy auto', { hitsPerPage: 5 })
  console.log(`\n✓ Search "billy auto": ${sampleResult.nbHits} results`)
  console.log('\nSample hit to inspect structure:')
  if (sampleResult.hits[0]) {
    const hit = sampleResult.hits[0]
    console.log('  Title:', hit.title)
    console.log('  customFilters:', hit.customFilters)
    console.log('  All fields:', Object.keys(hit))
  }
}

testFilters().catch(console.error)
