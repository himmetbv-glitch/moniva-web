import "./detail.css";

export default function Loading() {
  return (
    <div className="pdet">
      <div className="pd-crumb">
        <span className="skel" style={{ width: 280, height: 12 }} />
      </div>

      <div className="pd-top">
        <div className="pd-gallery">
          <div className="skel" style={{ height: 360 }} />
          <div className="pd-thumbs">
            {[0, 1, 2, 3].map((i) => (
              <div className="skel" key={i} style={{ height: 76 }} />
            ))}
          </div>
        </div>

        <div className="pd-center">
          <div className="skel" style={{ width: "70%", height: 28, marginBottom: 14 }} />
          <div className="skel" style={{ width: 200, height: 16, marginBottom: 20 }} />
          <div className="skel" style={{ width: "100%", height: 120, marginBottom: 18 }} />
          <div className="skel" style={{ width: "100%", height: 160 }} />
        </div>

        <div className="pd-side">
          <div className="skel" style={{ height: 120, marginBottom: 14 }} />
          <div className="skel" style={{ height: 40, marginBottom: 8 }} />
          <div className="skel" style={{ height: 46 }} />
        </div>
      </div>

      <div className="pd-sections">
        <div className="skel" style={{ width: 220, height: 24, marginBottom: 18 }} />
        <div className="pd-cols">
          <div className="skel" style={{ height: 180 }} />
          <div className="skel" style={{ height: 180 }} />
        </div>
      </div>
    </div>
  );
}
