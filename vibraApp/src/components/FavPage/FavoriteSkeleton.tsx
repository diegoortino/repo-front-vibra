export function FavoriteSkeleton() {
  return (
    <div className="profileContainer">
      <div className="loadingContainer">

        {/* Content Sections Skeleton */}
        <div className="contentSections">
          {/* Historial Skeleton */}
          <div className="sectionLoading">
            <div className="skeleton skeleton-title"></div>
            <div className="itemsGridLoading">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="item">
                  <div className="skeleton skeleton-item-cover"></div>
                  <div>
                    <div className="skeleton skeleton-text skeleton-item-name"></div>
                    <div className="skeleton skeleton-text skeleton-item-artist"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Imágenes Skeleton */}
          <div className="section">
            <div className="skeleton skeleton-title"></div>
            <div className="itemsGrid">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="item">
                  <div className="skeleton skeleton-item-cover"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
