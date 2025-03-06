import { useState, useRef } from "react";
import type { MetaFunction } from "@remix-run/node";
import { ClientOnly } from "remix-utils/client-only";

// Declare Celestial in global scope for TypeScript
declare global {
  interface Window {
    Celestial: any;
    d3: any;
  }
}

export const meta: MetaFunction = () => {
  return [
    { title: "Night Sky Generator" },
    { name: "description", content: "Generate beautiful star sky images based on date and location" },
  ];
};

function StarMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  
  // Date and Location state
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [latitude, setLatitude] = useState<string>("51.5074"); // London by default
  const [longitude, setLongitude] = useState<string>("-0.1278");
  
  const generateStarMap = () => {
    if (typeof window === 'undefined' || !window.Celestial || !mapContainerRef.current) {
      console.error("Celestial is not available or map container is not ready");
      return;
    }
    setIsGenerating(true);
    
    // Ensure we have a clean container
    const container = mapContainerRef.current;
    container.innerHTML = "";
    
    // Force container to have the correct ID
    container.id = "celestial-map";

    // Parse date and time
    const dateObj = new Date(`${date}T${time}:00Z`);
    
    // Generate the map
    // Access Celestial through the window object
    const celestialLib = window.Celestial;
    
    // Create a minimal config with only the necessary parameters
    const minimalConfig = {
      width: 600,
        height: 800,
        projection: "equirectangular",
        transform: "equatorial",
        center: [0, 0],
        datapath: "/data/",
        container: "celestial-map",
        background: { fill: "#000", opacity: 1 },
        stars: { show: true },
        dsos: { show: true },
        constellations: { show: true },
        mw: { show: true },
        location: {
          lat: parseFloat(latitude),
          lon: parseFloat(longitude)
        },
        date: dateObj,
        follow: "zenith"
      };
      
      console.log("Initializing celestial map with config:", minimalConfig);
      celestialLib.display(minimalConfig);
      
      // Register a callback to capture the SVG after rendering
      setTimeout(() => {
        try {
          console.log("Looking for SVG in container #celestial-map");
          const svg = document.querySelector('#celestial-map svg');
          if (svg) {
            console.log("SVG found, capturing it");
            const serializer = new XMLSerializer();
            const svgStr = serializer.serializeToString(svg);
            const svgBlob = new Blob([svgStr], {type: 'image/svg+xml;charset=utf-8'});
            const url = URL.createObjectURL(svgBlob);
            setImageUrl(url);
            console.log("SVG captured and ready for download");
          } else {
            console.error("No SVG element found");
          }
        } catch (e) {
          console.error("Error in SVG capture:", e);
        }
        setIsGenerating(false);
      }, 2000);
  };

  const downloadImage = () => {
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `star-map-${date}-${longitude}-${latitude}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
          Night Sky Generator
        </h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Controls Panel */}
          <div className="bg-slate-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Customize Your Night Sky</h2>
            
            {/* Date and Time */}
            <div className="mb-4">
              <label htmlFor="date-input" className="block text-sm font-medium mb-1">Date</label>
              <input 
                id="date-input"
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 bg-slate-700 rounded text-white" 
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="time-input" className="block text-sm font-medium mb-1">Time</label>
              <input 
                id="time-input"
                type="time" 
                value={time} 
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-2 bg-slate-700 rounded text-white" 
              />
            </div>
            
            {/* Location */}
            <div className="mb-4">
              <label htmlFor="latitude-input" className="block text-sm font-medium mb-1">Latitude</label>
              <input 
                id="latitude-input"
                type="text" 
                value={latitude} 
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g. 51.5074"
                className="w-full p-2 bg-slate-700 rounded text-white" 
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="longitude-input" className="block text-sm font-medium mb-1">Longitude</label>
              <input 
                id="longitude-input"
                type="text" 
                value={longitude} 
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g. -0.1278"
                className="w-full p-2 bg-slate-700 rounded text-white" 
              />
            </div>
            
            {/* Generate Button */}
            <button
              onClick={generateStarMap}
              disabled={isGenerating}
              className={`w-full py-3 px-4 rounded-lg text-lg font-semibold transition duration-200 ${isGenerating ? 'bg-blue-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isGenerating ? 'Generating...' : 'Generate Star Map'}
            </button>
            
            {/* Download Button - only show when image is available */}
            {imageUrl && (
              <button
                onClick={downloadImage}
                className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center text-lg font-semibold"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download SVG
              </button>
            )}
          </div>
          
          {/* Star Map Display */}
          <div className="bg-black rounded-lg overflow-hidden flex items-center justify-center">
            <div className="relative w-[600px] h-[800px]">
              <div
                ref={mapContainerRef}
                id="celestial-map"
                className="w-full h-full bg-black"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  return (
    <ClientOnly fallback={<div className="p-8 text-center">Loading star map generator...</div>}>
      {() => <StarMap />}
    </ClientOnly>
  );
}