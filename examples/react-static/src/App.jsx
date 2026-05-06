import { useRef } from 'react';
import { MapaKitComponent } from '@mapakit/react';

export default function App() {
  const mapRef = useRef(null);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#06090f' }}>
      <MapaKitComponent
        ref={mapRef}
        configId="/config/mapa-agenda.json"
        configProvider="json-static"
        onReady={(e) => console.log('Mapa listo (React)!', e)}
        onFeatureClick={(e) => console.log('Feature click', e)}
        onFilterChange={(e) => console.log('Filter change', e)}
        onError={(e) => console.error('Error', e)}
      />
    </div>
  );
}
