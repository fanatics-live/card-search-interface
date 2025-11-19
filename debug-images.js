// Debug image data structure
import algoliasearch from 'algoliasearch'

const APP_ID = '3XT9C4X62I'
const API_KEY = 'fdbf8223519dc75dd9743f5f9d308436'
const INDEX_NAME = 'prod_item_state_v1'

const client = algoliasearch(APP_ID, API_KEY)
const index = client.initIndex(INDEX_NAME)

console.log('Checking image data structure...\n')

try {
  const result = await index.search('', {
    hitsPerPage: 5,
    attributesToRetrieve: ['*']
  })

  console.log('Sample records with image fields:\n')

  result.hits.forEach((hit, i) => {
    console.log(`\n${i + 1}. ${hit.title?.substring(0, 50)}...`)
    console.log('   objectID:', hit.objectID)
    console.log('   listingId:', hit.listingId)

    // Check all possible image field names
    console.log('\n   Image fields:')
    console.log('   - images:', hit.images)
    console.log('   - image:', hit.image)
    console.log('   - imageUrl:', hit.imageUrl)
    console.log('   - image_url:', hit.image_url)
    console.log('   - imageSets:', hit.imageSets)
    console.log('   - image_sets:', hit.image_sets)
    console.log('   - imageUrls:', hit.imageUrls)

    // Show all field names
    if (i === 0) {
      console.log('\n   All fields in first record:')
      console.log('   ', Object.keys(hit).join(', '))
    }
  })

} catch (error) {
  console.error('Error:', error.message)
}
