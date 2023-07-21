const axios = require('axios');
const fs = require('fs');
// Make a GET request to the API endpoint
axios.get('https://platform-assets.leolabs.space/visualization/data.json.gz')
  .then(response => {
    // Handle the response data
    const objects = response.data
    const filteredObjects = objects.objects.filter(obj => obj.originCountry === 'CN'  || obj.originCountry === 'US' && obj.type=== 'payload');
    console.error(filteredObjects);
    const noradIds = filteredObjects.map(obj => obj.noradId);

    // Convert the array of noradIds to a string
    const noradIdsString = noradIds.join('\n');

    // Write the noradIds string to a text file
    fs.writeFile('noradIds.txt', noradIdsString, err => {
      if (err) {
        console.error('Error:', err);
      } else {
        console.log('noradIds.txt file has been created successfully.');
      }
    });
  })
  .catch(error => {
    // Handle any errors
    console.error('Error:', error.message);
  });
