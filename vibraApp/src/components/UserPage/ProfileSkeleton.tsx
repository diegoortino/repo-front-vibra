export function ProfileSkeleton() {
  return (
    <div className="profileContainer">
      <div className="loadingContainer">
        {/* Profile Header Skeleton */}
        <div className="profileHeader">
          <div className="profileAvatar">
            <div className="logoPerfil skeleton skeleton-avatar"></div>
          </div>
          <div className="profileInfo">
            <div className="skeleton skeleton-text skeleton-username"></div>
            <div className="followStats">
              <div className="stat">
                <div className="skeleton skeleton-text skeleton-label"></div>
                <div className="skeleton skeleton-text skeleton-number"></div>
              </div>
              <div className="stat">
                <div className="skeleton skeleton-text skeleton-label"></div>
                <div className="skeleton skeleton-text skeleton-number"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections Skeleton */}
        <div className="contentSections">
          {/* Historial Skeleton */}
          <div className="section">
            <div className="itemsGrid">
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
