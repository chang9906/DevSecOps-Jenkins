const express = require('express');
const app = express();
const port = 8080; 
app.get('/', (req, res) => {
  res.send('The service is running!!');
});

app.listen(port, () => {
  console.log(`Server is up and listening at http://localhost:${port}`);
});
