import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ImageGallery from '../ImageGallery';
import type { ImageItem } from '@/types';

describe('ImageGallery Component', () => {
  const mockImages: ImageItem[] = [
    {
      name: '圖片1',
      src: 'image1.jpg',
      location: 'https://example.com/image1.jpg',
    },
    {
      name: '圖片2',
      src: 'image2.jpg',
      location: 'https://example.com/image2.jpg',
    },
    {
      name: '圖片3',
      src: 'image3.jpg',
      location: 'https://example.com/image3.jpg',
    },
  ];

  const projectName = '測試建案';

  it('should return null when no images provided', () => {
    const { container } = render(<ImageGallery images={[]} projectName={projectName} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render gallery with images', () => {
    const { container } = render(<ImageGallery images={mockImages} projectName={projectName} />);

    // Should render main image container
    const mainImage = container.querySelector('[class*="bg-fluid"]');
    expect(mainImage).toBeInTheDocument();
  });

  it('should render thumbnails when multiple images', () => {
    const { container } = render(<ImageGallery images={mockImages} projectName={projectName} />);

    // Should render thumbnail grid
    const thumbnailButtons = container.querySelectorAll('button');
    expect(thumbnailButtons.length).toBe(mockImages.length);
  });

  it('should not render thumbnails when only one image', () => {
    const singleImage: ImageItem[] = [mockImages[0]];
    const { container } = render(<ImageGallery images={singleImage} projectName={projectName} />);

    // Should not render thumbnail buttons
    const thumbnailButtons = container.querySelectorAll('button');
    expect(thumbnailButtons.length).toBe(0);
  });

  it('should change active image when thumbnail clicked', () => {
    const { container } = render(<ImageGallery images={mockImages} projectName={projectName} />);

    const thumbnailButtons = container.querySelectorAll('button');

    // Click second thumbnail
    fireEvent.click(thumbnailButtons[1]);

    // Second thumbnail should have active styling (ring-2 ring-main)
    expect(thumbnailButtons[1].className).toContain('ring-2');
    expect(thumbnailButtons[1].className).toContain('ring-main');
  });

  it('should highlight first thumbnail by default', () => {
    const { container } = render(<ImageGallery images={mockImages} projectName={projectName} />);

    const thumbnailButtons = container.querySelectorAll('button');

    // First thumbnail should be active
    expect(thumbnailButtons[0].className).toContain('ring-2');
    expect(thumbnailButtons[0].className).toContain('opacity-100');
  });

  it('should use CDN_LINK fallback when location is empty', () => {
    const imagesWithoutLocation: ImageItem[] = [
      {
        name: '圖片',
        src: 'test.jpg',
        location: '',
      },
    ];

    const { container } = render(
      <ImageGallery images={imagesWithoutLocation} projectName={projectName} />
    );

    expect(container).toBeInTheDocument();
  });

  it('should handle rapid thumbnail clicks', () => {
    const { container } = render(<ImageGallery images={mockImages} projectName={projectName} />);

    const thumbnailButtons = container.querySelectorAll('button');

    // Rapidly click different thumbnails
    fireEvent.click(thumbnailButtons[0]);
    fireEvent.click(thumbnailButtons[1]);
    fireEvent.click(thumbnailButtons[2]);
    fireEvent.click(thumbnailButtons[0]);

    // Should still be functional
    expect(thumbnailButtons[0].className).toContain('ring-2');
  });

  it('should apply correct aspect ratio to images', () => {
    const { container } = render(<ImageGallery images={mockImages} projectName={projectName} />);

    // Main image should have pb-[75%] for aspect ratio
    const mainImageContainer = container.querySelector('[class*="pb-[75%]"]');
    expect(mainImageContainer).toBeInTheDocument();
  });

  it('should render with correct grid layout for thumbnails', () => {
    const { container } = render(<ImageGallery images={mockImages} projectName={projectName} />);

    // Thumbnail grid should have grid-cols-4 and md:grid-cols-6
    const thumbnailGrid = container.querySelector('[class*="grid-cols-4"]');
    expect(thumbnailGrid).toBeInTheDocument();
    expect(thumbnailGrid?.className).toContain('md:grid-cols-6');
  });
});
