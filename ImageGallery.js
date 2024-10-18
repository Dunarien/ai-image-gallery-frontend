ECHO est  activado.
import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Loader2 } from 'lucide-react';

const ImageGallery = () => {
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const onButtonClick = () => {
    inputRef.current.click();
  };

  const handleFiles = async (files) => {
    setIsLoading(true);
    setError(null);
    try {
      const newImages = await Promise.all(
        Array.from(files).map(async (file) => {
          if (file.type.startsWith('image/')) {
            return await analyzeImage(file);
          }
        })
      );
      setImages((prevImages) => {
        const updatedImages = [...prevImages, ...newImages.filter(Boolean)];
        setFilteredImages(updatedImages);
        return updatedImages;
      });
    } catch (err) {
      console.error('Error processing images:', err);
      setError('Error processing one or more images. Please try again.');
    }
    setIsLoading(false);
  };

  const analyzeImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post('http://localhost:5000/api/analyze-image', formData);
      return {
        url: URL.createObjectURL(file),
        ...response.data,
      };
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw new Error('Failed to analyze image');
    }
  };

  const searchImages = useCallback(() => {
    const filtered = images.filter((img) =>
      img.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.keywords.some((keyword) => keyword.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredImages(filtered);
  }, [images, searchQuery]);

  const showAllImages = useCallback(() => {
    setFilteredImages(images);
    setSearchQuery('');
  }, [images]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI Image Gallery</h1>

      <form
        onDragEnter={handleDrag}
        onSubmit={(e) => e.preventDefault()}
        className="mb-4"
      >
        <input
          ref={inputRef}
          type="file"
          multiple={true}
          onChange={handleChange}
          accept="image/*"
          className="hidden"
        />
        <div
          className={`flex justify-center items-center h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none ${
            dragActive ? "border-blue-500" : ""
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
        >
          <span className="flex items-center space-x-2">
            <span className="font-medium text-gray-600">
              Drag images here, or click to select files
            </span>
          </span>
        </div>
      </form>

      <div className="mb-4 flex items-center space-x-2">
        <Input 
          type="text" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search images..."
          className="flex-grow"
        />
        <Button onClick={searchImages} disabled={isLoading}>
          Search
        </Button>
        <Button onClick={showAllImages} variant="secondary" disabled={isLoading}>
          Show All
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center my-4">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing images...
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredImages.map((img, index) => (
          <div key={index} className="border p-4 rounded-lg shadow-md">
            <img src={img.url} alt={img.title} className="w-full h-48 object-cover mb-2 rounded" />
            <h3 className="font-bold text-lg mb-1">{img.title}</h3>
            <p className="text-sm mb-1"><strong>Prompt:</strong> {img.prompt}</p>
            <p className="text-sm mb-1"><strong>Format:</strong> {img.format}</p>
            <p className="text-sm"><strong>Keywords:</strong> {img.keywords.slice(0, 5).join(', ')}...</p>
          </div>
        ))}
      </div>

      {filteredImages.length === 0 && !isLoading && (
        <Alert>
          <AlertTitle>No images found</AlertTitle>
          <AlertDescription>
            {images.length === 0 
              ? "Drag and drop some images or use the button to select files."
              : "No images match your search criteria."}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ImageGallery;
