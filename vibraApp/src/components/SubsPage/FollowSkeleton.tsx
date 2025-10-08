import './FollowSkeleton.css';

export function FollowSkeleton() {
  return (
    <div className="skeletonContainer">
      <div className="loadingContainer">
        {/* Línea arriba */}
        <div style={{ marginBottom: '40px' }}>
          <div className="skeleton skeleton-title" style={{ width: '200px', height: '24px' }}></div>
        </div>

        {/* Tres cuadrados centrados abajo */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="skeleton"
              style={{
                width: '230px',
                height: '150px',
                borderRadius: '8px'
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}