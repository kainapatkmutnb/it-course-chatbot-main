const HomeOverview = () => (
  <figure className="m-0 min-w-0">
    <img
      src="/images/academic-course-preview.webp"
      alt="ตัวอย่างหน้าจอค้นหาและกรองรายวิชาในระบบ IT Assistant"
      width={1440}
      height={960}
      fetchPriority="high"
      className="h-auto w-full rounded-xl border border-border shadow-sm"
    />
    <figcaption className="mt-3 text-sm text-muted-foreground">
      ตัวอย่างหน้าจอหลักสูตรจากข้อมูลทดสอบ
    </figcaption>
  </figure>
);

export default HomeOverview;
