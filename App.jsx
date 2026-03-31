// Import necessary libraries
import React from 'react';
import { parse } from 'papaparse';

// Component for handling CSV data
const App = () => {
  const handleFileUpload = (file) => {
    parse(file, {
      complete: (results) => {
        const courseData = results.data;
        const parsedData = [];
        // Your existing parsing logic here

        // Update to reflect the new logic based on the given requirement
        for (let i = 0; i < courseData.length; i += 4) {
          const topicName = courseData[i][0]; // First column as topic name
          const rowData = {
            topic: topicName,
            R1: courseData[i + 1] ? courseData[i + 1][0] : '',
            R2: courseData[i + 2] ? courseData[i + 2][0] : '',
            Col: courseData[i + 3] ? courseData[i + 3][0] : '',
          };
          parsedData.push(rowData);
        }
        console.log(parsedData);
      },
    });
  };

  return (
    <div>
      <h1>CSV Parser</h1>
      <input type="file" accept=".csv" onChange={(e) => handleFileUpload(e.target.files[0])} />
    </div>
  );
};

export default App;
