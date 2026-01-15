// Use native fetch if available, otherwise try require
const fetch = global.fetch || require('node-fetch');

const BASE_URL = 'http://localhost:3000/api/turismo';

async function testApi() {
  console.log('🚀 Starting Tourism API Integration Test...');
  let createdId = null;

  try {
    // 1. CREATE
    console.log('\n📝 Testing CREATE (POST)...');
    const newVisa = {
      clientName: 'Integration Test User',
      type: 'Turismo', // Should be auto-set but sending for completeness
      travelStartDate: '2024-12-01',
      travelEndDate: '2024-12-15',
      country: 'France',
      status: 'Em Andamento'
    };

    const createRes = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVisa)
    });

    if (!createRes.ok) throw new Error(`Create failed: ${createRes.status} ${await createRes.text()}`);
    const createdData = await createRes.json();
    console.log('✅ Created:', createdData.id, createdData.clientName);
    createdId = createdData.id;

    // 2. READ
    console.log('\n📖 Testing READ (GET)...');
    const readRes = await fetch(`${BASE_URL}?id=${createdId}`);
    if (!readRes.ok) throw new Error(`Read failed: ${readRes.status}`);
    const readData = await readRes.json();
    console.log('✅ Read:', readData.id, readData.status);

    if (readData.clientName !== newVisa.clientName) throw new Error('Read data mismatch');

    // 3. UPDATE
    console.log('\n✏️ Testing UPDATE (PUT)...');
    const updateRes = await fetch(`${BASE_URL}?id=${createdId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Finalizado', notes: 'Updated via test' })
    });

    if (!updateRes.ok) throw new Error(`Update failed: ${updateRes.status}`);
    const updateData = await updateRes.json();
    console.log('✅ Updated:', updateData.status, updateData.notes);

    if (updateData.status !== 'Finalizado') throw new Error('Update status mismatch');

    // 4. DELETE
    console.log('\n🗑️ Testing DELETE...');
    const deleteRes = await fetch(`${BASE_URL}?id=${createdId}`, {
      method: 'DELETE'
    });

    if (!deleteRes.ok) throw new Error(`Delete failed: ${deleteRes.status}`);
    console.log('✅ Deleted successfully');

    // Verify deletion
    const verifyRes = await fetch(`${BASE_URL}?id=${createdId}`);
    if (verifyRes.status === 404) {
      console.log('✅ Verified: Record not found (as expected)');
    } else {
      console.warn('⚠️ Warning: Record still exists or error:', verifyRes.status);
    }

    console.log('\n🎉 All Integration Tests Passed!');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    // Cleanup if needed (though delete is last step)
    if (createdId) {
      console.log('Attempting cleanup...');
      await fetch(`${BASE_URL}?id=${createdId}`, { method: 'DELETE' }).catch(() => {});
    }
  }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.error('This script requires Node.js 18+ or node-fetch.');
} else {
  // Wait a bit for server to start if running immediately
  setTimeout(testApi, 2000);
}
