export default function Loading() {
  return (
    <>
      <div className="banner">
        <div className="banner-row">
          <div>
            <div className="banner-kicker">━━ Katalog</div>
            <h1 className="banner-title">Ürünler.</h1>
            <div
              className="skel"
              style={{ width: 420, maxWidth: "80%", height: 14, marginTop: 8 }}
            />
          </div>
        </div>
      </div>

      <div className="catalog">
        <aside className="sidebar">
          <div className="skel" style={{ width: 140, height: 16, marginBottom: 12 }} />
          <div className="skel" style={{ width: "100%", height: 34, marginBottom: 10 }} />
          <div className="skel" style={{ width: "100%", height: 200 }} />
        </aside>

        <div className="grid-wrap">
          <div className="skel" style={{ width: "100%", height: 44, marginBottom: 16 }} />
          <div className="pgrid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div className="pcard" key={i}>
                <div className="skel" style={{ height: 180 }} />
                <div className="pc-body">
                  <div className="pc-main">
                    <div className="skel" style={{ width: 70, height: 10, marginBottom: 8 }} />
                    <div className="skel" style={{ width: "90%", height: 14, marginBottom: 8 }} />
                    <div className="skel" style={{ width: "60%", height: 11, marginBottom: 14 }} />
                  </div>
                  <div className="skel" style={{ height: 34, marginTop: "auto" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
