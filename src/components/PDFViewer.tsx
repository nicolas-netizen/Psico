import React from 'react';

interface PDFViewerProps {
  pdfUrl: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl }) => {
  // Asegurarse de que la URL comience con /public si es un archivo local
  const fullUrl = pdfUrl.startsWith('http') ? pdfUrl : `/public/tests/${pdfUrl}`;

  return (
    <div className="w-full h-screen">
      <iframe
        src={fullUrl}
        className="w-full h-full"
        title="PDF Viewer"
      />
    </div>
  );
};

export default PDFViewer;
