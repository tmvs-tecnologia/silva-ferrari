const { LexmlService } = require('./src/lib/lexml');

async function test() {
  console.log("Testing LexML Search...");
  const searchResult = await LexmlService.search("Lei 14.133", 1, 5);
  console.log("Search Success:", searchResult.success);
  console.log("Total Results:", searchResult.totalResults);
  if (searchResult.results.length > 0) {
    console.log("First result URN:", searchResult.results[0].urn);
    
    console.log("\nTesting LexML Metadata Extraction...");
    const metadata = await LexmlService.getMetadata(searchResult.results[0].urn);
    console.log("Metadata title:", metadata?.title);
    console.log("Metadata author:", metadata?.author);
  }
}

test().catch(console.error);
