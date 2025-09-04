import React, { useState } from 'react';
import JSZip from 'jszip';

function App() {
  const [projectNumber, setProjectNumber] = useState('');
  const [status, setStatus] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadName, setDownloadName] = useState('');

  function startsWithProjectNumber(name: string, projectNumber: string): boolean {
    return name.startsWith(projectNumber + "-") || name.startsWith(projectNumber + " ");
  }

  function renamePushpins(xmlDoc: Document, projectNumber: string): number {
    const placemarks = xmlDoc.getElementsByTagName('Placemark');
    let renamedCount = 0;

    for (let i = 0; i < placemarks.length; i++) {
      const placemark = placemarks[i];
      const nameNode = placemark.querySelector('name');
      if (!nameNode) continue;

      let originalName = nameNode.textContent?.trim() || '';
      if (
        originalName === "Untitled Polygon" ||
        originalName === "Untitled Path" ||
        startsWithProjectNumber(originalName, projectNumber)
      ) continue;

      // Match study type prefix and number/letter suffix
      const match = originalName.match(/(?:ATR|TMC|P&B|QUE|ADT)-(\d+[A-Z]?)/i);
      if (!match) continue;
      const locationNumber = match[1].padStart(3, '0');

      // Clean name: remove prefix and "48-HR", "24-HR", etc.
      let cleanedName = originalName
        .replace(/(?:ATR|TMC|P&B|QUE|ADT)-\d+[A-Z]?\s*/i, '')
        .replace(/\b\d{1,3}-HR\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

      // Final renamed format
      const newName = `${projectNumber}-${locationNumber}${cleanedName ? ' ' + cleanedName : ''}`;
      nameNode.textContent = newName;
      renamedCount++;
    }

    return renamedCount;
  }

  async function processKMZ(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fileInput = document.getElementById('kmzFile') as HTMLInputElement;
    
    if (!fileInput.files?.[0] || !projectNumber.trim()) {
      alert('Please upload a KMZ file and enter a project number.');
      return;
    }

    try {
      const file = fileInput.files[0];
      const zip = await JSZip.loadAsync(file);
      const kmlFile = Object.keys(zip.files).find(name => name.endsWith('.kml'));

      if (!kmlFile) {
        alert('KML file not found in KMZ.');
        return;
      }

      const kmlText = await zip.files[kmlFile].async('string');
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(kmlText, 'text/xml');

      const renamedCount = renamePushpins(xmlDoc, projectNumber.trim());

      const serializer = new XMLSerializer();
      const updatedKml = serializer.serializeToString(xmlDoc);
      zip.file(kmlFile, updatedKml);

      const updatedBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(updatedBlob);

      setDownloadUrl(url);
      setDownloadName(`Updated-${file.name}`);
      setStatus(`✅ Renamed ${renamedCount} pushpin placemarks.`);
    } catch (error) {
      console.error('Error processing KMZ:', error);
      setStatus('❌ Error processing file. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-600 to-slate-800 flex flex-col">
      {/* Header */}
      <header className="text-center py-8">
        <h1 className="text-5xl font-bold text-white tracking-wide drop-shadow-lg">
          Renamer (All Regions)
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="bg-gradient-to-b from-white to-gray-50 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20 backdrop-blur-sm">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            KMZ Pushpin Renamer
          </h2>
          
          <form onSubmit={processKMZ} className="space-y-4">
            <div>
              <input
                type="text"
                value={projectNumber}
                onChange={(e) => setProjectNumber(e.target.value)}
                placeholder="Enter Project Number (e.g., 25-260108)"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 bg-white shadow-sm"
              />
            </div>
            
            <div>
              <input
                type="file"
                id="kmzFile"
                accept=".kmz"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 shadow-sm"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Rename Pushpins
            </button>
          </form>

          {downloadUrl && (
            <div className="mt-6 text-center">
              <a
                href={downloadUrl}
                download={downloadName}
                className="inline-block bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Download Updated KMZ
              </a>
            </div>
          )}

          {status && (
            <div className="mt-4 text-center text-gray-700 font-medium">
              {status}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6">
        <p className="text-white/80 text-sm">
          © 2025 Renamer created by John Bodino
        </p>
      </footer>
    </div>
  );
}

export default App;
