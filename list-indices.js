// List all available Algolia indices
import algoliasearch from 'algoliasearch'

const APP_ID = '3XT9C4X62I'
const API_KEY = 'fdbf8223519dc75dd9743f5f9d308436'

console.log('Listing all Algolia indices...\n')

const client = algoliasearch(APP_ID, API_KEY)

try {
  const { items } = await client.listIndices()

  if (items.length === 0) {
    console.log('⚠️  No indices found in this Algolia application')
  } else {
    console.log(`✅ Found ${items.length} index(es):\n`)
    items.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}`)
      console.log(`   Entries: ${index.entries}`)
      console.log(`   Created: ${index.createdAt}`)
      console.log(`   Updated: ${index.updatedAt}`)
      console.log('')
    })
  }
} catch (error) {
  console.error('❌ Error listing indices:')
  console.error(error.message)
}
