import React, { useState } from 'react';
import { Scatter } from "react-chartjs-2";
import { Chart as ChartJS, LinearScale, PointElement, Tooltip, Legend } from "chart.js";
import { getRelativePosition } from 'chart.js/helpers';


// Register the components
ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

// Generate random points in the range of -10 to 10
const generateRandomData = (numPoints) => {
  const data = [];
  for (let i = 0; i < numPoints; i++) {
    const x = Math.floor(Math.random() * 21) - 10; // Random x between -10 and 10
    const y = Math.floor(Math.random() * 21) - 10; // Random y between -10 and 10
    data.push({ x, y });
  }
  return data;
};



// Simulate KMeans step
const simulateKMeansStep = (data, centroids) => {
  const newClusters = Array(centroids.length).fill().map(() => []);
  data.forEach(point => {
    const distances = centroids.map(c => Math.hypot(c.x - point.x, c.y - point.y));
    const closest = distances.indexOf(Math.min(...distances));
    newClusters[closest].push(point);
  });

  const newCentroids = centroids.map((centroid, i) => {
    if (newClusters[i].length === 0) return centroid;
    const avgX = newClusters[i].reduce((sum, p) => sum + p.x, 0) / newClusters[i].length;
    const avgY = newClusters[i].reduce((sum, p) => sum + p.y, 0) / newClusters[i].length;
    return { x: avgX, y: avgY };
  });

  return { centroids: newCentroids, clusters: newClusters };
};

const App: React.FC = () => {
  const [clusters, setClusters] = useState(2); // Default to 3 clusters
  const [initializationMethod, setInitializationMethod] = useState('Random');
  const [randomData, setRandomData] = useState(generateRandomData(80)); // Initial dataset
  const [centroids, setCentroids] = useState([]);
  const [clusteredData, setClusteredData] = useState([]); // Data grouped by clusters
  const [step, setStep] = useState(0); // Tracks the step of KMeans algorithm
  const [isConverged, setIsConverged] = useState(false);
  const [manualPoints, setManualPoints] = useState(0);

  // Initialize cluster centroids based on selected method
const initializeCentroids = (data, k, method) => {
  if (method === "Random") {
    return data.sort(() => Math.random() - 0.5).slice(0, k);
  } else if (method === "Farthest-First") {
    let centroids = [data[Math.floor(Math.random() * data.length)]];
    while (centroids.length < k) {
      const farthest = data.reduce((farthest, point) => {
        const minDist = Math.min(...centroids.map(c => Math.hypot(c.x - point.x, c.y - point.y)));
        return minDist > farthest.dist ? { point, dist: minDist } : farthest;
      }, { dist: -Infinity, point: null }).point;
      centroids.push(farthest);
    }
    return centroids;
  } else if (method === "KMeans++") {
    const centroids = [data[Math.floor(Math.random() * data.length)]];
    while (centroids.length < k) {
      const distances = data.map(point =>
        Math.min(...centroids.map(c => Math.hypot(c.x - point.x, c.y - point.y)))
      );
      const sumDist = distances.reduce((sum, dist) => sum + dist, 0);
      const random = Math.random() * sumDist;
      let cumSum = 0;
      for (let i = 0; i < data.length; i++) {
        cumSum += distances[i];
        if (cumSum >= random) {
          centroids.push(data[i]);
          break;
        }
      }
    }
    return centroids;
  } else if (method === "Manual"){
    return centroids;
  }else {
    return [];
  }
};

  // Handle cluster input change
  const handleClusterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClusters(Number(e.target.value));
  };

  // Handle method change
  const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setInitializationMethod(e.target.value);
  };

  // Initialize clusters
  const handleInitializeClusters = () => {
    const initialCentroids = initializeCentroids(randomData, clusters, initializationMethod);
    setCentroids(initialCentroids);
    setIsConverged(false); // Reset convergence
  };

  // Generate a new random dataset
  const handleGenerateNewDataset = () => {
    setRandomData(generateRandomData(100)); // Reset data
    setStep(0); // Reset the step count
    setIsConverged(false); // Reset convergence state
    setClusteredData(Array(clusters.length).fill().map(() => [])); // Clear clusters
    setCentroids([]);
    setManualPoints(0);
  };

  // Step through KMeans algorithm
  const handleStepThroughKMeans = () => {
    if (step === 0){
      setStep(1); // Start at step 1
      handleInitializeClusters(); // Initialize clusters if not already done

    }else if (!isConverged && centroids.length) {

      const { centroids: newCentroids, clusters: newClusters } = simulateKMeansStep(randomData, centroids);
      setClusteredData(newClusters);
      setStep((prevStep) => prevStep + 1); // Update step using a functional update

      console.log(step);
      console.log(JSON.stringify(centroids), JSON.stringify(newCentroids));

      if (JSON.stringify(centroids) === JSON.stringify(newCentroids)) {
        setIsConverged(true); // Convergence when centroids stop moving
      }
      setCentroids(newCentroids);

    }
  };
  
  // Run KMeans algorithm to convergence
  const handleRunToConvergence = async () => {
    setIsConverged(true); // Reset convergence
    const initialCentroids = initializeCentroids(randomData, clusters, initializationMethod);
    setCentroids(initialCentroids);

    
  };
  

  // Reset the algorithm
  const handleResetAlgorithm = () => {
    setCentroids([]);
    setClusteredData([]);
    setStep(0);
    setIsConverged(false);
    setClusters(3); // Reset to default cluster count
    setManualPoints(0);
  };

  const chartData = {
    datasets: [
      {
        label: isConverged ? "Converged Data" : "Random Dataset",
        data: randomData,
        backgroundColor: isConverged ? "rgba(255, 99, 132, 0.6)" : "rgba(75, 192, 192, 0.6)",
      },
      ...(centroids.length ? [{
        label: 'Centroids',
        data: centroids,
        backgroundColor: 'rgba(255, 99, 132, 1)',
        pointRadius: 8,
      }] : []),
    ],
  };

  const options = {
    scales: {
      x: {
        type: "linear",
        position: "bottom",
        min: -10, // Set the min and max for x axis
        max: 10,
      },
      y: {
        min: -10, // Set the min and max for y axis
        max: 10,
      },
    },
    onClick: (e, chartElement, chart) => {
      // Check if the initialization method is "Manual"
      if (initializationMethod === "Manual" && manualPoints < clusters) {
        const canvasPosition = getRelativePosition(e, chart);
  
        // Get data coordinates from pixel coordinates
        const xValue = chart.scales.x.getValueForPixel(canvasPosition.x);
        const yValue = chart.scales.y.getValueForPixel(canvasPosition.y);
  
        setManualPoints((prev) => prev + 1);
        // Add new point to the chart
        addPoint(xValue, yValue);
        console.log(xValue, yValue);
      }
    },
  };
  const addPoint = (x, y) => {
    const newPoint = { x, y };

    // Update chartData by adding a new point
    setCentroids([...centroids, newPoint]);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="bg-white p-10 rounded-lg shadow-lg max-w-sm w-full">
        <h1 className="text-2xl font-bold text-center mb-6 text-blue-600">KMeans Clustering Algorithm</h1>
        
        <div className="mb-4">
          <label htmlFor="clusters" className="block text-sm font-medium text-gray-700">Number of Clusters (k):</label>
          <input
            type="number"
            id="clusters"
            value={clusters}
            onChange={handleClusterChange}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="method" className="block text-sm font-medium text-gray-700">Initialization Method:</label>
          <select
            id="method"
            value={initializationMethod}
            onChange={handleMethodChange}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Random">Random</option>
            <option value="Farthest-First">Farthest First</option>
            <option value="KMeans++">KMeans++</option>
            <option value="Manual">Manual</option>
          </select>
        </div>

        <div className="space-y-2 mb-6">

          <button
            onClick={handleStepThroughKMeans}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
            disabled={isConverged}
          >
            Step through KMeans
          </button>

          <button
            onClick={handleRunToConvergence}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded"
          >
            Run to Convergence
          </button>

          <button
            onClick={handleResetAlgorithm}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
          >
            Reset Algorithm
          </button>

          <button
            onClick={handleGenerateNewDataset}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
          >
            Generate New Dataset
          </button>
        </div>

        <div className="mb-4">
          {isConverged && <p className="text-sm text-green-600">Converged!</p>}
        </div>
      </div>
      <div className="w-1/2 p-10">
          <Scatter data={chartData} options={options} />
      </div>
    </div>
  );
};

export default App;
