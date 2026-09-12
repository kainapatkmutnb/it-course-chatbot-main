import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="academic-auth min-h-[60vh] flex items-center justify-center">
      <div className="academic-panel max-w-md w-full p-8 text-center">
        <h1 className="academic-title mb-2">404</h1>
        <p className="academic-copy mb-6 mx-auto">ไม่พบหน้าที่คุณต้องการ</p>
        <a
          href="/"
          className="inline-flex items-center justify-center academic-control px-6 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          กลับหน้าหลัก
        </a>
      </div>
    </div>
  );
};

export default NotFound;
